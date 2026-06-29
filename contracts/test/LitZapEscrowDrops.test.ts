import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

// Covers the money primitives the app's Send-by-social and red-packet Drop
// flows depend on: LitZapEscrow (create / claim / refund) and LitZapDrops
// (create / claim / reclaim), across both native and ERC-20 (USDC-like) tokens.
describe("LitZap money paths", () => {
  // The oracle that authorizes escrow releases. Its address is set as `signer`
  // on the contract; here we hold its private key so we can produce signatures.
  const oracle = ethers.Wallet.createRandom();

  async function deploy() {
    const [creator, alice, bob] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("LitZapEscrow");
    const escrow = await Escrow.deploy(oracle.address);

    const Drops = await ethers.getContractFactory("LitZapDrops");
    const drops = await Drops.deploy();

    const Mock = await ethers.getContractFactory("MockERC20");
    const usdc = await Mock.deploy("USD Coin", "USDC", 6);

    return { creator, alice, bob, escrow, drops, usdc };
  }

  // Reproduces the contract's release digest: an oracle signature over
  // (chainid, escrow, id, to), bound to the payout address so it can't be
  // replayed or front-run.
  async function signRelease(escrowAddr: string, id: number, to: string) {
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const inner = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "address", "uint256", "address"],
        [chainId, escrowAddr, id, to]
      )
    );
    return oracle.signMessage(ethers.getBytes(inner));
  }

  const KEY = ethers.keccak256(ethers.toUtf8Bytes("x:bob"));

  describe("Escrow (pay-by-social)", () => {
    it("releases native funds to the address the oracle signed for", async () => {
      const { alice, bob, escrow } = await deploy();
      const amount = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;

      await escrow.connect(alice).createEscrow(ethers.ZeroAddress, amount, KEY, expiry, "gm", { value: amount });

      const sig = await signRelease(await escrow.getAddress(), 1, bob.address);
      await expect(escrow.connect(bob).claim(1, bob.address, sig)).to.changeEtherBalance(bob, amount);
    });

    it("rejects a signature for a different payout address (front-run safe)", async () => {
      const { alice, bob, creator, escrow } = await deploy();
      const amount = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await escrow.connect(alice).createEscrow(ethers.ZeroAddress, amount, KEY, expiry, "", { value: amount });

      // oracle signed for bob, attacker tries to redirect to themselves
      const sigForBob = await signRelease(await escrow.getAddress(), 1, bob.address);
      await expect(
        escrow.connect(creator).claim(1, creator.address, sigForBob)
      ).to.be.revertedWithCustomError(escrow, "BadSignature");
    });

    it("cannot be claimed after expiry, but the funder can always refund", async () => {
      const { alice, bob, escrow } = await deploy();
      const amount = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await escrow.connect(alice).createEscrow(ethers.ZeroAddress, amount, KEY, expiry, "", { value: amount });

      await expect(escrow.connect(alice).refund(1)).to.be.revertedWithCustomError(escrow, "NotExpired");

      await time.increaseTo(expiry + 1);
      const sig = await signRelease(await escrow.getAddress(), 1, bob.address);
      await expect(escrow.connect(bob).claim(1, bob.address, sig)).to.be.revertedWithCustomError(escrow, "Expired");

      await expect(escrow.connect(alice).refund(1)).to.changeEtherBalance(alice, amount);
    });

    it("only the funder can refund", async () => {
      const { alice, bob, escrow } = await deploy();
      const amount = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await escrow.connect(alice).createEscrow(ethers.ZeroAddress, amount, KEY, expiry, "", { value: amount });
      await time.increaseTo(expiry + 1);
      await expect(escrow.connect(bob).refund(1)).to.be.revertedWithCustomError(escrow, "NotFunder");
    });

    it("escrows and releases an ERC-20 (USDC) balance", async () => {
      const { alice, bob, escrow, usdc } = await deploy();
      const amount = 100_000000n; // 100 USDC (6 decimals)
      await usdc.mint(alice.address, amount);
      await usdc.connect(alice).approve(await escrow.getAddress(), amount);

      const expiry = (await time.latest()) + 3600;
      await escrow.connect(alice).createEscrow(await usdc.getAddress(), amount, KEY, expiry, "", { value: 0 });

      const sig = await signRelease(await escrow.getAddress(), 1, bob.address);
      await expect(escrow.connect(bob).claim(1, bob.address, sig)).to.changeTokenBalance(usdc, bob, amount);
    });
  });

  describe("Drops (red-packet)", () => {
    const code = ethers.keccak256(ethers.toUtf8Bytes("party2026"));

    it("splits a native pot equally and the last claimer sweeps the dust", async () => {
      const { creator, alice, bob, drops } = await deploy();
      const pot = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await drops.connect(creator).createDrop(code, ethers.ZeroAddress, pot, 2, false, expiry, { value: pot });

      await expect(drops.connect(alice).claim(code)).to.changeEtherBalance(alice, pot / 2n);
      await expect(drops.connect(bob).claim(code)).to.changeEtherBalance(bob, pot / 2n);
    });

    it("rejects a second claim from the same address and over-claiming", async () => {
      const { creator, alice, bob, drops } = await deploy();
      const [, , , dave] = await ethers.getSigners();
      const pot = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await drops.connect(creator).createDrop(code, ethers.ZeroAddress, pot, 2, false, expiry, { value: pot });

      await drops.connect(alice).claim(code);
      // same address can't double-dip (still slots left, so this is the gate that trips)
      await expect(drops.connect(alice).claim(code)).to.be.revertedWithCustomError(drops, "AlreadyClaimed");
      // bob takes the last slot, then the pot is exhausted for everyone else
      await drops.connect(bob).claim(code);
      await expect(drops.connect(dave).claim(code)).to.be.revertedWithCustomError(drops, "AllGone");
    });

    it("lets the creator reclaim the unclaimed remainder only after expiry", async () => {
      const { creator, alice, drops } = await deploy();
      const pot = ethers.parseEther("1");
      const expiry = (await time.latest()) + 3600;
      await drops.connect(creator).createDrop(code, ethers.ZeroAddress, pot, 2, false, expiry, { value: pot });

      await drops.connect(alice).claim(code); // takes half

      await expect(drops.connect(creator).reclaim(code)).to.be.revertedWithCustomError(drops, "NotExpired");
      await time.increaseTo(expiry + 1);
      await expect(drops.connect(creator).reclaim(code)).to.changeEtherBalance(creator, pot / 2n);
    });

    it("funds and claims an ERC-20 (USDC) drop", async () => {
      const { creator, alice, drops, usdc } = await deploy();
      const pot = 50_000000n; // 50 USDC
      await usdc.mint(creator.address, pot);
      await usdc.connect(creator).approve(await drops.getAddress(), pot);

      const expiry = (await time.latest()) + 3600;
      await drops.connect(creator).createDrop(code, await usdc.getAddress(), pot, 1, false, expiry, { value: 0 });

      await expect(drops.connect(alice).claim(code)).to.changeTokenBalance(usdc, alice, pot);
    });
  });
});
