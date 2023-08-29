import { ethers } from "hardhat";
import "dotenv/config";
import { OWNERS, required } from "../owners";

async function main() {
  const Factory = await ethers.getContractFactory("Multisig");
  const multisig = await Factory.deploy(OWNERS, required);
  await multisig.waitForDeployment();

  return console.log(`address : ${multisig.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
