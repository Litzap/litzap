const hre = require("hardhat");

// Deploys LitZapEscrow. The verification signer (oracle) defaults to the
// deployer/relayer wallet so the existing server key can authorize claims.
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const signer = process.env.SIGNER_ADDRESS || deployer.address;

  console.log(`Network:  ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Signer:   ${signer}`);

  const F = await hre.ethers.getContractFactory("LitZapEscrow");
  const c = await F.deploy(signer);
  await c.waitForDeployment();
  console.log(`LitZapEscrow: ${await c.getAddress()}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
