import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("LitZap core", () => {
  async function deploy() {
    const [owner, alice, bob, fee] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("LitZapRegistry");
    const registry = await Registry.deploy();

    const Pay = await ethers.getContractFactory("LitZapPay");
    const pay = await Pay.deploy(fee.address, 25); // 0.25%

    return { owner, alice, bob, fee, registry, pay };
  }

  describe("Registry", () => {
    it("registers and resolves a username", async () => {
      const { alice, registry } = await deploy();
      await registry.connect(alice).register("zapster");
      expect(await registry.resolve("zapster")).to.equal(alice.address);
      expect(await registry.nameOf(alice.address)).to.equal("zapster");
    });

    it("rejects duplicates and bad names", async () => {
      const { alice, bob, registry } = await deploy();
      await registry.connect(alice).register("zapster");
      await expect(registry.connect(bob).register("zapster")).to.be.revertedWithCustomError(registry, "NameTaken");
      await expect(registry.connect(bob).register("AB")).to.be.revertedWithCustomError(registry, "InvalidName");
      await expect(registry.connect(bob).register("bad name")).to.be.revertedWithCustomError(registry, "InvalidName");
    });
  });

  describe("Direct pay (native)", () => {
    it("transfers net to recipient and fee to feeRecipient", async () => {
      const { alice, bob, fee, pay } = await deploy();
      const amount = ethers.parseEther("1");
      const expectedFee = (amount * 25n) / 10_000n;

      await expect(
        pay.connect(alice).pay(bob.address, ethers.ZeroAddress, amount, "gm", { value: amount })
      ).to.changeEtherBalances([bob, fee], [amount - expectedFee, expectedFee]);
    });

    it("reverts on wrong msg.value", async () => {
      const { alice, bob, pay } = await deploy();
      const amount = ethers.parseEther("1");
      await expect(
        pay.connect(alice).pay(bob.address, ethers.ZeroAddress, amount, "x", { value: amount - 1n })
      ).to.be.revertedWithCustomError(pay, "WrongValue");
    });
  });

  describe("Boomerang claim", () => {
    it("recipient claims with the secret", async () => {
      const { alice, bob, pay } = await deploy();
      const amount = ethers.parseEther("2");
      const secret = ethers.toUtf8Bytes("open-sesame");
      const secretHash = ethers.keccak256(secret);
      const expiry = (await time.latest()) + 3600;

      await pay.connect(alice).createClaim(ethers.ZeroAddress, amount, expiry, secretHash, { value: amount });

      await expect(
        pay.connect(bob).claim(1, secret, bob.address)
      ).to.changeEtherBalance(bob, amount - (amount * 25n) / 10_000n);
    });

    it("auto-returns to sender after expiry (Boomerang)", async () => {
      const { alice, pay } = await deploy();
      const amount = ethers.parseEther("2");
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes("nobody-claims"));
      const expiry = (await time.latest()) + 3600;

      await pay.connect(alice).createClaim(ethers.ZeroAddress, amount, expiry, secretHash, { value: amount });
      const net = amount - (amount * 25n) / 10_000n;

      await expect(pay.connect(alice).reclaim(1)).to.be.revertedWithCustomError(pay, "NotExpired");
      await time.increaseTo(expiry + 1);
      await expect(pay.connect(alice).reclaim(1)).to.changeEtherBalance(alice, net);
    });

    it("rejects a wrong secret", async () => {
      const { alice, bob, pay } = await deploy();
      const amount = ethers.parseEther("1");
      const secretHash = ethers.keccak256(ethers.toUtf8Bytes("right"));
      const expiry = (await time.latest()) + 3600;
      await pay.connect(alice).createClaim(ethers.ZeroAddress, amount, expiry, secretHash, { value: amount });
      await expect(
        pay.connect(bob).claim(1, ethers.toUtf8Bytes("wrong"), bob.address)
      ).to.be.revertedWithCustomError(pay, "BadSecret");
    });
  });
});
