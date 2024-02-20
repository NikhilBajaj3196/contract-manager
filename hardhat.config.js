require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_API_KEY}`,
      chainId: 11155111,
      live: true,
      gasPrice: 20000000000, // 20 gwei
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: process.env.ETHESCAN_API_KEY
  }
};
