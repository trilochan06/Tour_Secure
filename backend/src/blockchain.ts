import "dotenv/config";
import { ethers } from "ethers";
import ABI from "../../blockchain/abi/TouristID.json" assert { type: "json" };

function readEnv(name: string): string {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function readPk(): string {
  const pk = readEnv("BLOCKCHAIN_PRIVATE_KEY").trim();
  // normalize possible quotes/newlines
  const cleaned = pk.replace(/['"\u2018\u2019\u201C\u201D]/g, "");
  if (!/^0x[0-9a-fA-F]{64}$/.test(cleaned)) {
    throw new Error(
      `Invalid BLOCKCHAIN_PRIVATE_KEY format (len=${cleaned.length}). Expected 0x + 64 hex chars.`
    );
  }
  return cleaned;
}

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _contract: ethers.Contract | null = null;

export function getProvider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(readEnv("BLOCKCHAIN_RPC"));
  return _provider;
}

export function getWallet() {
  if (!_wallet) _wallet = new ethers.Wallet(readPk(), getProvider());
  return _wallet;
}

export function getContract() {
  if (!_contract) {
    _contract = new ethers.Contract(readEnv("CONTRACT_ADDRESS"), ABI as any, getWallet());
  }
  return _contract;
}

export async function issueTouristID(to: string, tokenURI: string, kycHash: string, validUntil: number) {
  const contract = getContract();
  const tx = await contract.issue(to, tokenURI, kycHash as `0x${string}`, validUntil);
  const receipt = await tx.wait();

  const iface = new ethers.Interface(ABI as any);
  let tokenId = 0;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === "TouristIssued") { tokenId = Number(parsed.args.tokenId); break; }
    } catch {}
  }
  return { txHash: receipt.hash, tokenId };
}

export function getContractAddress() {
  return readEnv("CONTRACT_ADDRESS");
}
