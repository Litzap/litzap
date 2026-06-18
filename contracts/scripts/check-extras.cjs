const { ethers } = require("ethers");
const fs = require("fs");

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const CAP = "0x3F7b5DC6687761A8B49bC57B33183EB5150180b0";
const abi = [
  "function mint(string,string) returns (uint256)",
  "function ownerOf(uint256) view returns (address)",
  "function capsuleName(uint256) view returns (string)",
  "function nextId() view returns (uint256)",
];

(async () => {
  const p = new ethers.JsonRpcProvider(env.LITEFORGE_RPC);
  const w = new ethers.Wallet(env.DEPLOYER_PK, p);
  const c = new ethers.Contract(CAP, abi, w);
  const tx = await c.mint("Auto-Stash", "ipfs://demo");
  console.log("mint tx:", tx.hash);
  await tx.wait();
  const id = (await c.nextId()) - 1n;
  console.log("minted id", id.toString(), "| owner", await c.ownerOf(id), "| name", await c.capsuleName(id));
})().catch((e) => console.log("ERR", e.shortMessage || e.message));
