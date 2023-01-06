const { ethers, getNamedAccounts, network } = require("hardhat");

const enterRaffle = async () => {
    const { deployer } = await getNamedAccounts();

    const Raffle = await ethers.getContract("Raffle", deployer);
    const entranceFee = ethers.utils.parseEther("0.01").toString();

    const txResponse = await Raffle.enterRaffle({ value: entranceFee });
    await txResponse.wait(1);

    const winnerStartingBalance = await ethers.provider.getBalance(deployer);

    await new Promise(async (resolve, reject) => {
        Raffle.once("WinnerPicked", async (winner) => {
            try {
                console.log(
                    "\x1b[35m%s\x1b[0m",
                    "-------------------------------------------------------------------------------"
                );
                console.log(`\x1b[32mWinner: ${winner}\x1b[0m`);
                console.log(`\x1b[32mDeployer: ${deployer}\x1b[0m`);
                console.log(
                    "\x1b[35m%s\x1b[0m",
                    "-------------------------------------------------------------------------------"
                );
                console.log("");

                const winnerEndingBalance = await ethers.provider.getBalance(winner);

                console.log(
                    "\x1b[35m%s\x1b[0m",
                    "-------------------------------------------------------------------------------"
                );
                console.log(
                    `\x1b[35mWinner Starting Balance was \x1b[36m${ethers.utils.formatEther(
                        winnerStartingBalance.toString()
                    )} ETH \x1b[35m!\x1b[0m`
                );
                console.log(
                    `\x1b[35mWinner Ending Balance is \x1b[36m${ethers.utils.formatEther(
                        winnerEndingBalance.add(entranceFee).toString()
                    )} ETH \x1b[35m!\x1b[0m`
                );
                console.log(
                    "\x1b[35m%s\x1b[0m",
                    "-------------------------------------------------------------------------------"
                );
                console.log("");

                console.log("\x1b[32m%s\x1b[0m", "Winner Picked!");
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        if (network.config.chainId === 31337) {
            const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);

            const interval = await Raffle.getInterval();
            await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await ethers.provider.send("evm_mine", []);

            const checkdata = ethers.utils.keccak256(ethers.utils.formatBytes32String("0"));
            const upkeepNeeded = await Raffle.callStatic.checkUpkeep(checkdata);

            if (upkeepNeeded) {
                const txResponse = await Raffle.performUpkeep(checkdata);
                const txReceipt = await txResponse.wait(1);

                const requestId = await txReceipt.events[1].args.requestId;

                const fulfillTxResponse = await VRFCoordinatorV2Mock.fulfillRandomWords(requestId, Raffle.address);
                await fulfillTxResponse.wait(1);
            }
        }

        console.log("\x1b[33m%s\x1b[0m", "Waiting Winner to be picked...");
    });
};

enterRaffle()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(`\x1b[31menterRaffle.js -- ERROR: ${err}\x1b[0m`);
        process.exit(1);
    });
