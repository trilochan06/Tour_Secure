import { ethers } from "hardhat";
import * as dotenv from "dotenv";


dotenv.config();


const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const TOKEN_ID = Number(process.env.TOKEN_ID || "1");
const NEW_URI = process.env.NEW_URI || "ipfs://bafy.../updated.json";


async function main() {
if (!CONTRACT_ADDRESS) throw new Error("Set CONTRACT_ADDRESS in .env");
const contract = await ethers.getContractAt("TouristID", CONTRACT_ADDRESS);
const tx = await contract.updateURI(TOKEN_ID, NEW_URI);
console.log("UpdateURI tx:", (await tx.wait())?.hash);
}


main().catch((e) => { console.error(e); process.exit(1); });