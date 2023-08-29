import "dotenv/config";
import "@nomicfoundation/hardhat-toolbox";

module.exports = {
  solidity: "0.8.19",
  networks: {
    networkName: {
      url: process.env.NETWORK_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
