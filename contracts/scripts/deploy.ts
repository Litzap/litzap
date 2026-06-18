import { ethers, network } from "hardhat";

// Deploys LitZapRegistry + LitZapPay to the selected network.
// Usage: npm run deploy:liteforge
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const feeRecipient = process.env.FEE_RECIPIENT ?? deployer.address;
  const feeBps = Number(process.env.FEE_BPS ?? "25"); // 0.25% default

  const Registry = await ethers.getContractFactory("LitZapRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log(`LitZapRegistry: ${await registry.getAddress()}`);

  const Pay = await ethers.getContractFactory("LitZapPay");
  const pay = await Pay.deploy(feeRecipient, feeBps);
  await pay.waitForDeployment();
  console.log(`LitZapPay:      ${await pay.getAddress()}`);

  console.log("\nSave these to frontend/config + verify on the explorer.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
