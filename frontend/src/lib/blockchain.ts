// frontend/src/lib/blockchain.ts
import { ethers } from "ethers";
import ABI from "@/abi/TouristID.json";

export const TOURIST_ID_ADDRESS = import.meta.env.VITE_TOURIST_ID_ADDRESS!;

export function getProvider() {
  // Prefer browser wallet if present
  if ((window as any).ethereum) return new ethers.BrowserProvider((window as any).ethereum);
  // Fallback to local Hardhat node
  return new ethers.JsonRpcProvider("http://127.0.0.1:8545");
}

export async function getContract(signer = false) {
  const provider = getProvider();
  const base = signer ? await provider.getSigner() : provider;
  return new ethers.Contract(TOURIST_ID_ADDRESS, ABI as any, base);
}

export async function readTourist(tokenId: number) {
  const c = await getContract();
  const [valid, info] = await Promise.all([c.isValid(tokenId), c.info(tokenId)]);
  return { valid, info };
}
