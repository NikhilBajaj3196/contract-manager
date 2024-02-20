const { ethers } = require('hardhat');

// define the address for contract manager
const CONTRACT_MANAGER_ADDRESS = "";

async function main() {
  const contractManagerFactory = await ethers.getContractFactory("ContractManager");

  console.log("contract manager is deploying........");
  const contractManager = await contractManagerFactory.deploy(CONTRACT_MANAGER_ADDRESS);

  console.log("contractManager deployed at address: ", await contractManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});