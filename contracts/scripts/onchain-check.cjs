const { ethers } = require("ethers");
const fs = require("fs");

const env = Object.fromEntries(
  fs.readFileSync(".env", "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const REG = "0x5F98A240De0a92620Fad513525c4F5f046b4A81D";
const abi = [
  "function register(string) external",
  "function resolve(string) view returns (address)",
  "function nameOf(address) view returns (string)",
];

(async () => {
  const provider = new ethers.JsonRpcProvider(env.LITEFORGE_RPC);
  const wallet = new ethers.Wallet(env.DEPLOYER_PK, provider);
  const reg = new ethers.Contract(REG, abi, wallet);

  const existing = await reg.nameOf(wallet.address);
  if (!existing) {
    const tx = await reg.register("zapster");
    console.log("register tx:", tx.hash);
    await tx.wait();
    console.log("confirmed");
  } else {
    console.log("already registered as:", existing);
  }
  console.log("resolve('zapster') ->", await reg.resolve("zapster"));

  // prove a DIFFERENT account cannot take the same name
  const other = new ethers.VoidSigner("0x000000000000000000000000000000000000dEaD", provider);
  const reg2 = new ethers.Contract(REG, abi, other);
  try {
    await reg2.register.staticCall("zapster");
    console.log("DUPLICATE ALLOWED — uniqueness NOT enforced!");
  } catch (e) {
    console.log("duplicate blocked ->", e.shortMessage || e.reason || e.message);
  }
})().catch((e) => console.log("ERR", e.shortMessage || e.message));
