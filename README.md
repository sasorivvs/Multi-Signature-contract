# Multi-Sig project

This project is used to create multi-sig contracts

## Getting Started

Clone this project to pull down some basic starter code.
After that cd into the base directory of the project and run `npm install` to download all the project dependencies.

## 1. Add your deployer key and API to as an environment variable for the project

Create an empty `.env` file in the base directory of this project.
Add the following line to the `.env` file replacing `NETWORK_URL` with your api key:

NETWORK_URL =your network url;
PRIVATE_KEY = your deployer private key;

## 2. Create an Owners file

Create an empty `owners.ts` file in the base directory of this project.
Add the following lines to the `owners.ts` file replacing `OWNERS` with your owners of your contract and `required`
with the required number of signatures to accept the transaction:
const OWNERS = [];
const required = ;

export { OWNERS, required };

## 3. Compile the contract

To compile the contract run `npx hardhat compile` in your terminal. The compile task is one of the built-in tasks.

## 4 Deploy the contract to a live network

To deploy the contract run `npx hardhat run scripts/deploy.js --network <network-name>` in your terminal.

run

# Multi-Sig
