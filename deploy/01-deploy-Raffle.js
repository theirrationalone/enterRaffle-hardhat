const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-config");
require("dotenv").config();

const verify = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { deploy, log } = deployments;
    const chainId = network.config.chainId;
    let VRFCoordinatorV2Mock, vrfCoordinatorAddress, subscriptionId;

    if (!!developmentChains.includes(network.name)) {
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        vrfCoordinatorAddress = VRFCoordinatorV2Mock.address;
        const txResponse = await VRFCoordinatorV2Mock.createSubscription();
        const txReceipt = await txResponse.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.utils.parseEther("2").toString());
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinatorAddress"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const interval = networkConfig[chainId]["interval"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"];

    const args = [vrfCoordinatorAddress, entranceFee, interval, gasLane, subscriptionId, callbackGasLimit];

    log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
    log("\x1b[33m%s\x1b[0m", "Deploying Contract, Please Wait...");
    const Raffle = await deploy("Raffle", {
        contract: "Raffle",
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("\x1b[32m%s\x1b[0m", "Contract Deployed Successfully!");
    log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
    log("");

    if (!!developmentChains.includes(network.name)) {
        log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
        log("\x1b[33m%s\x1b[0m", "Adding Consumer, Please Wait...");
        await VRFCoordinatorV2Mock.addConsumer(subscriptionId, Raffle.address);
        log("\x1b[32m%s\x1b[0m", "Consumer Added Successfully!");
        log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
        log("");
    }

    if (!developmentChains.includes(network.name) && !!process.env.ETHERSCAN_API_KEY) {
        log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
        log("\x1b[33m%s\x1b[0m", "Verifying Contract, Please Wait...");
        await verify(Raffle.address, args);
        log("\x1b[32m%s\x1b[0m", "Contract Verified Successfully!");
        log("\x1b[35m%s\x1b[0m", "-------------------------------------------------------------------------------");
        log("");
    }
};

module.exports.tags = ["all", "Raffle"];
