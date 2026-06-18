const { ethers } = require("ethers");
const fs = require("fs");
const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const PAY = "0xE5bF48f6b6Ea117Cac3Fa7B5E466441778E28c9A";
const abi = ["function pay(address to,address token,uint256 amount,string note) payable"];
const to = "0x000000000000000000000000000000000000dEaD";
(async () => {
  const p = new ethers.JsonRpcProvider(env.LITEFORGE_RPC);
  const w = new ethers.Wallet(env.DEPLOYER_PK, p);
  const c = new ethers.Contract(PAY, abi, w);
  const before = await p.getBalance(to);
  const amt = ethers.parseEther("0.001");
  const tx = await c.pay(to, ethers.ZeroAddress, amt, "e2e test", { value: amt });
  console.log("pay tx:", tx.hash);
  await tx.wait();
  const after = await p.getBalance(to);
  console.log("recipient received:", ethers.formatEther(after - before), "zkLTC");
})().catch((e) => console.log("ERR", e.shortMessage || e.message));
