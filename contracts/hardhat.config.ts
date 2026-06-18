import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PK = process.env.DEPLOYER_PK;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    // LitVM / LiteForge testnet — Chain ID 4441.
    // Fill LITEFORGE_RPC from the official LitVM docs.
    liteforge: {
      url: process.env.LITEFORGE_RPC ?? "",
      chainId: 4441,
      accounts: PK ? [PK] : [],
    },
  },
};

export default config;
