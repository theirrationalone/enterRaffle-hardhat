const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { assert, expect } = require("chai");

const { developmentChains, networkConfig } = require("../../helper-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("\x1b[35mRaffle -- Unit Testing\x1b[0m", () => {
          let deployer, Raffle, VRFCoordinatorV2Mock, entranceFee, interval;
          const chainId = network.config.chainId;
          const keepersBytesData = ethers.utils.keccak256(ethers.utils.formatBytes32String("0"));

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              const { fixture } = deployments;
              await fixture(["all"]);

              Raffle = await ethers.getContract("Raffle", deployer);
              VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);

              entranceFee = (await Raffle.getEntranceFee()).toString();
              interval = await Raffle.getInterval();
          });

          describe("\x1b[34mConstructor\x1b[0m", () => {
              it("\x1b[36mShould set \x1b[35m'VRFCoordinatorAddress' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const vrfAddress = await Raffle.getVRFCoordinatorAddress();

                  assert.equal(vrfAddress, VRFCoordinatorV2Mock.address);
              });

              it("\x1b[36mShould set \x1b[35m'entranceFee' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const entranceFeeFromHelper = networkConfig[chainId]["entranceFee"];

                  assert.equal(entranceFee, entranceFeeFromHelper);
              });

              it("\x1b[36mShould set \x1b[35m'Interval' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const intervalFromHelper = networkConfig[chainId]["interval"];

                  assert.equal(interval.toString(), intervalFromHelper);
              });

              it("\x1b[36mShould set \x1b[35m'Keyhash/gasLane' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const gasLane = networkConfig[chainId].gasLane;

                  const keyHash = await Raffle.getGasLane();

                  assert.equal(keyHash, gasLane);
              });

              it("\x1b[36mShould set \x1b[35m'SubscriptionId' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const subscriptionId = await Raffle.getSubscriptionId();

                  assert.notEqual(subscriptionId.toString(), "0");
              });

              it("\x1b[36mShould set \x1b[35m'CallbackGasLimit' \x1b[36mcorrectly!\x1b[0m", async () => {
                  const callbackGasLimitFromHelper = networkConfig[chainId].callbackGasLimit;
                  const callbackGasLimit = await Raffle.getCallbackGasLimit();

                  assert.equal(callbackGasLimit.toString(), callbackGasLimitFromHelper);
              });

              it("\x1b[36mShould have \x1b[35m'Raffle State' \x1b[36min \x1b[35m'OPEN' \x1b[36mState' initially!\x1b[0m", async () => {
                  const raffleState = await Raffle.getRaffleState();

                  assert.equal(raffleState.toString(), "0");
              });

              it("\x1b[36mShould have a valid \x1b[35m'timestamp'!\x1b[0m", async () => {
                  const timestamp = (await Raffle.getLastTimestamp()).toString();
                  const lastTimestamp = new Date().getTime().toString();

                  assert.notEqual(timestamp.toString(), "0");
                  assert(0 < timestamp && timestamp < lastTimestamp);
              });

              it("\x1b[36mShould have no players into Raffle initially!\x1b[0m", async () => {
                  const playersLength = await Raffle.getPlayersLength();

                  assert.equal(playersLength.toString(), "0");
              });

              it("\x1b[36mShould be reverted due to no players into Raffle!\x1b[0m", async () => {
                  await expect(Raffle.getPlayer("0")).to.be.reverted;
              });
          });

          describe("\x1b[34menterRaffle\x1b[0m", () => {
              it("\x1b[36mShould be reverted with msg \x1b[35m 'Raffle__notPaidEnoughToEnter' \x1b[36m!\x1b[0m", async () => {
                  await expect(Raffle.enterRaffle()).to.be.revertedWithCustomError(
                      Raffle,
                      "Raffle__notPaidEnoughToEnter"
                  );
              });

              it("\x1b[36mShould be reverted with msg \x1b[35m 'Raffle__RaffleNotOpen' \x1b[36m!\x1b[0m", async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await ethers.provider.send("evm_mine", []);

                  const performUpkeepTxResponse = await Raffle.performUpkeep(keepersBytesData);
                  await performUpkeepTxResponse.wait(1);

                  await expect(Raffle.enterRaffle({ value: entranceFee })).to.be.revertedWithCustomError(
                      Raffle,
                      "Raffle__RaffleNotOpen"
                  );
              });

              it("\x1b[36mShould emit an Event named \x1b[35m'RaffleEnter' \x1b[36mon successful player entry!\x1b[0m", async () => {
                  await expect(Raffle.enterRaffle({ value: entranceFee })).to.emit(Raffle, "RaffleEnter");
              });

              it("\x1b[36mShould wait for an Event named \x1b[35m'RaffleEnter' \x1b[36mto be completed!\x1b[0m", async () => {
                  return new Promise(async (resolve, reject) => {
                      Raffle.once("RaffleEnter", async (EnteredPlayer) => {
                          try {
                              console.log("\x1b[32m%s\x1b[0m", "Entered Player: " + EnteredPlayer);
                              assert.equal(EnteredPlayer, deployer);
                              resolve();
                          } catch (e) {
                              reject(new Error(`\x1b[31mError: ${e.message}\x1b[0m`));
                          }
                      });

                      const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                      await txResponse.wait(1);

                      await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                      await ethers.provider.send("evm_mine", []);

                      const performUpkeepTxResponse = await Raffle.performUpkeep(keepersBytesData);
                      await performUpkeepTxResponse.wait(1);

                      console.log("\x1b[33m%s\x1b[0m", "Waiting for Event to be completed...");
                  });
              });

              it("\x1b[36mShould Record Player on a successful Raffle Entry!\x1b[0m", async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  const player = await Raffle.getPlayer("0");

                  assert.equal(player, deployer);
              });

              it("\x1b[36mShould have Players Length equals to \x1b[35m'1' \x1b[36mon a successful Raffle Entry!\x1b[0m", async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  const playersLength = await Raffle.getPlayersLength();

                  assert.equal(playersLength.toString(), "1");
              });
          });

          describe("\x1b[34mcheckUpkeep\x1b[0m", () => {
              it("\x1b[36mShould be reverted if enough time isn't elapsed yet!", async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() - 10]);
                  await ethers.provider.send("evm_mine", []);

                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep(keepersBytesData);
                  expect(upkeepNeeded).to.be.reverted;
              });

              it("\x1b[36mShould be reverted if there's no Player(s) into Raffle!\x1b[0m", async () => {
                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await ethers.provider.send("evm_mine", []);

                  const { upkeepNeeded } = await Raffle.callStatic.checkUpkeep(keepersBytesData);

                  expect(upkeepNeeded).to.be.reverted;
              });
          });

          describe("\x1b[34mperformUpkeep\x1b[0m", () => {
              it("\x1b[36mShould be reverted with msg \x1b[35m'Raffle__UpkeepNotNeeded' \x1b[36m!\x1b[0m", async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() - 10]);
                  await ethers.provider.send("evm_mine", []);

                  await expect(Raffle.performUpkeep(keepersBytesData)).to.be.revertedWithCustomError(
                      Raffle,
                      "Raffle__UpkeepNotNeeded"
                  );
              });
          });

          describe("\x1b[34mfulfillRandomWords\x1b[0m", () => {
              beforeEach(async () => {
                  const txResponse = await Raffle.enterRaffle({ value: entranceFee });
                  await txResponse.wait(1);

                  await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await ethers.provider.send("evm_mine", []);
              });

              it("\x1b[36mShould be reverted with msg \x1b[35m'nonexistent request' \x1b[36m(first)!\x1b[0m", async () => {
                  await expect(VRFCoordinatorV2Mock.fulfillRandomWords("0", Raffle.address)).to.be.revertedWith(
                      "nonexistent request"
                  );
              });

              it("\x1b[36mShould be reverted with msg \x1b[35m'nonexistent request' \x1b[36m(second)!\x1b[0m", async () => {
                  await expect(VRFCoordinatorV2Mock.fulfillRandomWords("1", Raffle.address)).to.be.revertedWith(
                      "nonexistent request"
                  );
              });

              it("\x1b[36mShould emit an Event named \x1b[35m'WinnerPicked' \x1b[36msuccessfully!\x1b[0m", async () => {
                  const txResponse = await Raffle.performUpkeep(keepersBytesData);
                  const txReceipt = await txResponse.wait(1);

                  const requestId = await txReceipt.events[1].args.requestId;

                  await expect(VRFCoordinatorV2Mock.fulfillRandomWords(requestId.toString(), Raffle.address)).to.emit(
                      Raffle,
                      "WinnerPicked"
                  );
              });

              it("\x1b[36mMakes Entries of multiple Players, Emits an Event named \x1b[35m'WinnerPicked'\x1b[36m, Picks a Winner and Pays Winning Amount to Winner\x1b[0m", async () => {
                  const additionalEntrantsStartingIndex = 1;
                  const additionalEntrants = 5;

                  const accounts = await ethers.getSigners();

                  for (
                      let i = additionalEntrantsStartingIndex;
                      i < additionalEntrantsStartingIndex + additionalEntrants;
                      i++
                  ) {
                      const entrantConnectedRaffle = await Raffle.connect(accounts[i]);
                      const txResponse = await entrantConnectedRaffle.enterRaffle({ value: entranceFee });
                      await txResponse.wait(1);
                  }

                  await new Promise(async (resolve, reject) => {
                      Raffle.once("WinnerPicked", async (recentWinner) => {
                          try {
                              console.log("\x1b[30m%s\x1b[0m", "player 1: " + deployer);
                              console.log("\x1b[30m%s\x1b[0m", "player 2: " + accounts[1].address);
                              console.log("\x1b[30m%s\x1b[0m", "player 3: " + accounts[2].address);
                              console.log("\x1b[30m%s\x1b[0m", "player 4: " + accounts[3].address);
                              console.log("\x1b[30m%s\x1b[0m", "player 5: " + accounts[4].address);
                              console.log("\x1b[30m%s\x1b[0m", "player  6: " + accounts[5].address);
                              console.log("\x1b[32m%s\x1b[0m", "Winner is: " + recentWinner);

                              const raffleState = await Raffle.getRaffleState();
                              const winnerFetched = await Raffle.getRecentWinner();
                              const playersLength = await Raffle.getPlayersLength();
                              const entranceFeeFetched = await Raffle.getEntranceFee();

                              const winnerEndingBalance = (
                                  await ethers.provider.getBalance(accounts[5].address)
                              ).toString();

                              assert.equal(recentWinner, accounts[5].address);
                              assert.equal(recentWinner, winnerFetched);
                              assert.equal(raffleState.toString(), "0");
                              assert.equal(playersLength.toString(), "0");
                              await expect(Raffle.getPlayer("0")).to.be.reverted;
                              assert.equal(
                                  winnerEndingBalance,
                                  winnerStartingBalance
                                      .add(entranceFeeFetched.mul(additionalEntrants))
                                      .add(entranceFeeFetched)
                                      .toString()
                              );

                              resolve();
                          } catch (e) {
                              console.log(`\x1b[31mRaffle.test.js -- ERROR: ${e}\x1b[0m`);
                              reject(e);
                          }
                      });

                      await ethers.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                      await ethers.provider.send("evm_mine", []);

                      const winnerStartingBalance = await ethers.provider.getBalance(accounts[5].address);

                      const performUpkeepTxResponse = await Raffle.performUpkeep(keepersBytesData);
                      const performUpkeepTxReceipt = await performUpkeepTxResponse.wait(1);

                      const requestId = performUpkeepTxReceipt.events[1].args.requestId.toString();

                      const fulfillRandomWordsTxResponse = await VRFCoordinatorV2Mock.fulfillRandomWords(
                          requestId,
                          Raffle.address
                      );

                      await fulfillRandomWordsTxResponse.wait(1);

                      console.log("\x1b[33m%s\x1b[0m", "Waiting for Winner to be Picked...");
                  });
              });
          });
      });
