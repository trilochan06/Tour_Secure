import { ethers } from "hardhat";
import * as dotenv from "dotenv";


dotenv.config();


const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const TOKEN_ID = Number(process.env.TOKEN_ID || "1");


async function main() {
if (!CONTRACT_ADDRESS) throw new Error("Set CONTRACT_ADDRESS in .env");
const contract = await ethers.getContractAt("TouristID", CONTRACT_ADDRESS);
const tx = await contract.revoke(TOKEN_ID);
console.log("Revoke tx:", (await tx.wait())?.hash);
}


main().catch((e) => { console.error(e); process.exit(1); });