const { ethers } = require("ethers");
const fs = require("fs");
const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const PAY = "0xE5bF48f6b6Ea117Cac3Fa7B5E466441778E28c9A";
const abi = [
  "function setFee(uint16,address)",
  "function feeBps() view returns (uint16)",
  "function owner() view returns (address)",
];
(async () => {
  const p = new ethers.JsonRpcProvider(env.LITEFORGE_RPC);
  const w = new ethers.Wallet(env.DEPLOYER_PK, p);
  const c = new ethers.Contract(PAY, abi, w);
  console.log("owner:", await c.owner(), "| me:", w.address);
  const tx = await c.setFee(0, w.address);
  console.log("setFee tx:", tx.hash);
  await tx.wait();
  console.log("feeBps now:", (await c.feeBps()).toString());
})().catch((e) => console.log("ERR", e.shortMessage || e.message));
