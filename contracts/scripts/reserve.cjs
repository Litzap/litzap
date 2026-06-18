const { ethers } = require("ethers");
const fs = require("fs");
const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);
const REG = "0x5F98A240De0a92620Fad513525c4F5f046b4A81D";
const abi = ["function setReserved(string,bool)"];

const NAMES = [
  // system / brand
  "litzap", "zap", "zapster", "admin", "support", "help", "official", "team", "litvm", "litecoin", "ltc",
  // impersonation risk
  "coinbase", "binance", "circle", "usdc", "tether", "privy", "ethereum", "bitcoin", "metamask", "okx", "rabby",
  // founder / foundation
  "satoshilite", "charlielee", "litecoinfoundation", "ltcfoundation",
  // premium
  "pay", "money", "wallet", "bank", "app",
];

(async () => {
  const p = new ethers.JsonRpcProvider(env.LITEFORGE_RPC);
  const w = new ethers.Wallet(env.DEPLOYER_PK, p);
  const c = new ethers.Contract(REG, abi, w);
  for (const n of NAMES) {
    const tx = await c.setReserved(n, true);
    await tx.wait();
    console.log("reserved:", n);
  }
  console.log("done —", NAMES.length, "names reserved");
})().catch((e) => console.log("ERR", e.shortMessage || e.message));
