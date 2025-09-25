import { ethers } from "hardhat";
import * as dotenv from "dotenv";


dotenv.config();


function parseAddresses(env?: string): string[] {
if (!env) return [];
return env.split(",").map((s) => s.trim()).filter(Boolean);
}


async function main() {
const [deployer] = await ethers.getSigners();
console.log("Deployer:", deployer.address);


const TouristID = await ethers.getContractFactory("TouristID");
const contract = await TouristID.deploy(deployer.address);
await contract.waitForDeployment();


const address = await contract.getAddress();
console.log("TouristID deployed at:", address);


// Grant roles to configured addresses (optional)
const ISSUER_ADDRESSES = parseAddresses(process.env.ISSUER_ADDRESSES);
const REVOKER_ADDRESSES = parseAddresses(process.env.REVOKER_ADDRESSES);
const UPDATER_ADDRESSES = parseAddresses(process.env.UPDATER_ADDRESSES);
const PAUSER_ADDRESSES = parseAddresses(process.env.PAUSER_ADDRESSES);


const ISSUER_ROLE = await contract.ISSUER_ROLE();
const REVOKER_ROLE = await contract.REVOKER_ROLE();
const UPDATER_ROLE = await contract.UPDATER_ROLE();
const PAUSER_ROLE = await contract.PAUSER_ROLE();


async function grant(role: string, addrs: string[]) {
for (const a of addrs) {
const tx = await contract.grantRole(role, a);
await tx.wait();
console.log("Granted", role, "to", a);
}
}


await grant(ISSUER_ROLE, ISSUER_ADDRESSES);
await grant(REVOKER_ROLE, REVOKER_ADDRESSES);
await grant(UPDATER_ROLE, UPDATER_ADDRESSES);
await grant(PAUSER_ROLE, PAUSER_ADDRESSES);


console.log("Done.");
}


main().catch((e) => { console.error(e); process.exit(1); });