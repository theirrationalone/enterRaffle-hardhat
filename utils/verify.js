const { run } = require("hardhat");

module.exports = async (address, constructorArguments) => {
    try {
        await run("verify:verify", {
            address,
            constructorArguments,
        });
    } catch (e) {
        if (!!e.message.toLowerCase().includes("already verified")) {
            console.log("\x1b[32m%s\x1b[0m", "Contract Already Verified!");
        } else {
            console.log(` \x1b[31mverify.js -- ERROR: ${e}\x1b[0m`);
        }
    }
};
