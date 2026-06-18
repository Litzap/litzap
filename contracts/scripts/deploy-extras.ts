import { ethers, network } from "hardhat";

// Deploys LitZapCapsule (NFT) + LitZapSubscriptions (recurring) to the network.
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const Cap = await ethers.getContractFactory("LitZapCapsule");
  const cap = await Cap.deploy();
  await cap.waitForDeployment();
  console.log(`LitZapCapsule:       ${await cap.getAddress()}`);

  const Sub = await ethers.getContractFactory("LitZapSubscriptions");
  const sub = await Sub.deploy();
  await sub.waitForDeployment();
  console.log(`LitZapSubscriptions: ${await sub.getAddress()}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
