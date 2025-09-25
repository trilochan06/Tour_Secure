import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const { PRIVATE_KEY, RPC_SEPOLIA, RPC_AMOY } = process.env as {
  PRIVATE_KEY?: string;
  RPC_SEPOLIA?: string;
  RPC_AMOY?: string;
};

// Build networks object without inserting undefined entries
const networks: Record<string, { url: string; accounts?: string[] }> = {
  localhost: { url: "http://127.0.0.1:8545" },
};

if (PRIVATE_KEY && RPC_SEPOLIA) {
  networks.sepolia = { url: RPC_SEPOLIA, accounts: [PRIVATE_KEY] };
}
if (PRIVATE_KEY && RPC_AMOY) {
  networks.amoy = { url: RPC_AMOY, accounts: [PRIVATE_KEY] };
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks,
  // (optional) etherscan: { apiKey: { sepolia: "..." } }
};

export default config;
