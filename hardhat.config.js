require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "GOERLI_RPC_URL___NOT_PROVIDED";
const METAMASK_PRIVATE_KEY = process.env.METAMASK_PRIVATE_KEY || "METAMASK_PRIVATE_KEY___NOT_PROVIDED";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "ETHERSCAN_API_KEY___NOT_PROVIDED";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "COINMARKETCAP_API_KEY___NOT_PROVIDED";

module.exports = {
    defaultNetwork: "hardhat",
    solidity: {
        compilers: [{ version: "0.8.17" }, { version: "0.8.8" }],
    },
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [METAMASK_PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http:127.0.0.1:8545",
            chainId: 31337,
        },
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: true,
        noColors: true,
        currency: "USD",
        token: "MATIC",
        outputFile: "gas-report.txt",
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    mocha: {
        timeout: 1000 * 60 * 5,
    },
};
