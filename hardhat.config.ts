import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY ?? "0x" + "a".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // Local Hardhat node (default)
    hardhat: {
      chainId: 31337,
    },

    // Base Sepolia testnet
    baseSepolia: {
      url: process.env.RPC_URL ?? "https://sepolia.base.org",
      accounts: [DEPLOYER_KEY],
      chainId: 84532,
    },

    // Base mainnet (prod)
    base: {
      url: process.env.BASE_MAINNET_RPC ?? "https://mainnet.base.org",
      accounts: [DEPLOYER_KEY],
      chainId: 8453,
    },
  },

  // Artifacts & cache go inside hardhat/ so they don't pollute the root
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./hardhat/cache",
    artifacts: "./hardhat/artifacts",
  },

  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY ?? "",
      base: process.env.BASESCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },

  typechain: {
    outDir: "hardhat/typechain",
    target: "ethers-v6",
  },
};

export default config;