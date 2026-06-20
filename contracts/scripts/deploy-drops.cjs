const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Network:  ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);

  const F = await hre.ethers.getContractFactory("LitZapDrops");
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log(`LitZapDrops: ${await c.getAddress()}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
