import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatVerifyPlugin from "@nomicfoundation/hardhat-verify";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import { configVariable } from "hardhat/config";
import "dotenv/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatVerifyPlugin, hardhatNetworkHelpers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          evmVersion: "shanghai", // Required for Zilliqa 2.0 compatibility
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "shanghai", // Required for Zilliqa 2.0 compatibility
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    zilliqaMainnet: {
      type: "http",
      chainType: "l1",
      chainId: 32769,
      url: "https://api.zilliqa.com",
      accounts: [configVariable("ZILLIQA_MAINNET_PRIVATE_KEY")]
    },
    zilliqaTestnet: {
      type: "http",
      chainType: "l1",
      chainId: 33101,
      url: "https://api.testnet.zilliqa.com",
      accounts: [configVariable("ZILLIQA_TESTNET_PRIVATE_KEY")]
    },
  },
  verify: {
    // Disable Etherscan since we're using Zilliqa networks
    etherscan: {
      enabled: false,
    },
    // Blockscout verification (no API key needed)
    blockscout: {
      enabled: true,
    },
  },
  // Add custom chain descriptors for Zilliqa networks
  chainDescriptors: {
    // Zilliqa Mainnet
    32769: {
      name: "Zilliqa",
      blockExplorers: {
        blockscout: {
          name: "Zilliqa Explorer",
          url: "https://zilliqa.blockscout.com",
          apiUrl: "https://zilliqa.blockscout.com/api",
        },
      },
    },
    // Zilliqa Testnet
    33101: {
      name: "Zilliqa Testnet",
      blockExplorers: {
        blockscout: {
          name: "Zilliqa Testnet Explorer",
          url: "https://testnet.zilliqa.blockscout.com",
          apiUrl: "https://testnet.zilliqa.blockscout.com/api",
        },
      },
    },
  },
};

export default config;
