const fs = require("fs");
const path = require("path");
const { ethers, network } = require("hardhat");
require("dotenv").config();

const CONTRACT_ADDRESSES_FILE = path.resolve("../project-05-raffle-hardhat-frontend/constants/contractAddresses.json");

console.log("pth addr: ", CONTRACT_ADDRESSES_FILE);

const CONTRACT_ABI_FILE = path.resolve("../project-05-raffle-hardhat-frontend/constants/contractAbi.json");

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    if (!!process.env.UPDATE_FRONTEND) {
        await updateContractAddresses(deployer);
        await updateContractAbi(deployer);
    }
};

const updateContractAbi = async (deployer) => {
    const contract = await ethers.getContract("Raffle", deployer);
    const contractAbi = contract.interface.format(ethers.utils.FormatTypes.json);

    fs.writeFileSync(CONTRACT_ABI_FILE, contractAbi, "utf8");
    console.log("\x1b[32m%s\x1b[0m", "Contract ABI Updated and Ready to work with Frontend!");
};

const updateContractAddresses = async (deployer) => {
    const contract = await ethers.getContract("Raffle", deployer);
    const chainId = network.config.chainId.toString();

    let contractAddresses = JSON.parse(fs.readFileSync(CONTRACT_ADDRESSES_FILE, "utf8"));

    if (!!(chainId in contractAddresses)) {
        if (!contractAddresses[chainId].includes(contract.address)) {
            contractAddresses[chainId].push(contract.address);
        }
    } else {
        // contractAddresses[chainId] = [contract.address];
        contractAddresses = {
            ...contractAddresses,
            [chainId]: [contract.address],
        };
    }

    fs.writeFileSync(CONTRACT_ADDRESSES_FILE, JSON.stringify(contractAddresses), "utf8");
    console.log("\x1b[32m%s\x1b[0m", "Contract Addresses Updated and Ready to work with Frontend!");
};

module.exports.tags = ["all", "update-frontend"];
