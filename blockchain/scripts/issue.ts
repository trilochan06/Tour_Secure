import { ethers } from "hardhat";
import * as dotenv from "dotenv";


dotenv.config();


/*
Usage examples:
npx hardhat run scripts/issue.ts --network localhost
(then follow prompts you add later) or hardcode below for quick test.
*/


const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ""; // set after deploy


// Helper to parse either a 0x-hash or compute keccak256(utf8)
function toHash(input: string): string {
if (input.startsWith("0x") && input.length === 66) return input;
return ethers.keccak256(ethers.toUtf8Bytes(input));
}


async function main() {
if (!CONTRACT_ADDRESS) throw new Error("Set CONTRACT_ADDRESS in .env");
const contract = await ethers.getContractAt("TouristID", CONTRACT_ADDRESS);


const to = process.env.ISSUE_TO || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Hardhat #1
const uri = process.env.ISSUE_URI || "ipfs://bafy.../tourist-123.json";
const kycInput = process.env.ISSUE_KYC || "sample-kyc-bundle"; // put concatenated KYC fields off-chain
const validDays = Number(process.env.ISSUE_VALID_DAYS || "7");


const kycHash = toHash(kycInput);
const validUntil = Math.floor(Date.now() / 1000) + validDays * 86400;


console.log({ to, uri, kycHash, validUntil });
const tx = await contract.issue(to, uri, kycHash, validUntil);
const receipt = await tx.wait();
console.log("Issued. Tx:", receipt?.hash);
}


main().catch((e) => { console.error(e); process.exit(1); });