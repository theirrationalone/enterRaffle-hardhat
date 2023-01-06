const { network, getNamedAccounts, ethers } = require("hardhat");
const { assert, expect } = require("chai");

const { developmentChains } = require("../../helper-config");

!!developmentChains.includes(network.name)
    ? describe.skip
    : describe("\x1b[35mRaffle -- staging Testing\x1b[0m", () => {
          let deployer, Raffle, entranceFee;

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;

              Raffle = await ethers.getContract("Raffle", deployer);

              entranceFee = (await Raffle.getEntranceFee()).toString();
          });

          describe("\x1b[34mfulfillRandomWords\x1b[0m", () => {
              it("\x1b[36mWorks with Live Chain, Allows players entry, randomly chooses a winner, and Payoff the winner!\x1b[0m", (done) => {
                  const promiseReady = new Promise(async (resolve, reject) => {
                      const winnerStartingBalance = await ethers.provider.getBalance(deployer);
                      const startingTimestamp = await Raffle.getLastTimestamp();

                      const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                      const txReceipt = await txResponse.wait(1);

                      const { gasUsed, effectiveGasPrice } = txReceipt;

                      const gasConsumption = gasUsed.mul(effectiveGasPrice);

                      console.log("\x1b[33m%s\x1b[0m", "Waiting for Winner to be Picked...");

                      return Raffle.once("WinnerPicked", async (recentWinner) => {
                          try {
                              console.log("\x1b[30m%s\x1b[0m", "Deployer is: " + deployer);
                              console.log("\x1b[32m%s\x1b[0m", "Winner   is: " + recentWinner);

                              const raffleState = await Raffle.getRaffleState();
                              const winnerFetched = await Raffle.getRecentWinner();
                              const playersLength = await Raffle.getPlayersLength();
                              const entranceFeeFetched = await Raffle.getEntranceFee();
                              const EndingTimestamp = await Raffle.getLastTimestamp();

                              const winnerEndingBalance = await ethers.provider.getBalance(winnerFetched);
                              const balanceTally =
                                  winnerEndingBalance.add(gasConsumption).toString() ===
                                  winnerStartingBalance.toString();

                              console.log("\x1b[34m%s\x1b[0m", "entranceFee: " + entranceFeeFetched.toString());
                              console.log(
                                  "\x1b[34m%s\x1b[0m",
                                  "winnerStartingBalance: " + winnerStartingBalance.toString()
                              );
                              console.log("\x1b[34m%s\x1b[0m", "winnerEndingBalance: " + winnerEndingBalance);
                              console.log("\x1b[34m%s\x1b[0m", "gas-consumption: " + gasConsumption.toString());
                              console.log("\x1b[34m%s\x1b[0m", "Balance Tally?: " + balanceTally);

                              await expect(Raffle.getPlayer("0")).to.be.rejected;
                              assert.equal(recentWinner, deployer);
                              assert.equal(recentWinner, winnerFetched);
                              assert.equal(raffleState.toString(), "0");
                              assert.equal(playersLength.toString(), "0");
                              assert(EndingTimestamp.toString() > startingTimestamp.toString());
                              assert(balanceTally);
                              console.log("passed!");
                              resolve();
                          } catch (e) {
                              console.log(`\x1b[31mRaffle.test.js -- ERROR: ${e}\x1b[0m`);
                              reject(e);
                          }
                      });
                  });

                  promiseReady
                      .then(() => {
                          done();
                      })
                      .catch((e) => {
                          console.log("main error: ", e);
                      });
              });
          });
      });
