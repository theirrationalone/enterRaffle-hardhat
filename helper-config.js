const { ethers } = require("hardhat");

const ENTRANCE_FEE = ethers.utils.parseEther("0.01").toString();

const networkConfig = {
    5: {
        name: "goerli",
        vrfCoordinatorAddress: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        subscriptionId: "7569",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        entranceFee: ENTRANCE_FEE,
        callbackGasLimit: "500000",
        interval: "30",
    },
    31337: {
        name: "localhost",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        entranceFee: ENTRANCE_FEE,
        callbackGasLimit: "500000",
        interval: "30",
    },
};

const BASE_FEE = ethers.utils.parseEther("0.25").toString();
const GAS_PRICE_LINK = 1e9;

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
    BASE_FEE,
    GAS_PRICE_LINK,
};
