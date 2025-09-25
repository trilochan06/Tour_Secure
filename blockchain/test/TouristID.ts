import { expect } from "chai";
import { ethers } from "hardhat";


describe("TouristID", function () {
it("issues, enforces soulbound, and toggles flags", async () => {
const [admin, user] = await ethers.getSigners();
const TouristID = await ethers.getContractFactory("TouristID");
const c = await TouristID.deploy(admin.address);
await c.waitForDeployment();


const kycHash = ethers.keccak256(ethers.toUtf8Bytes("kyc123"));
const validUntil = Math.floor(Date.now()/1000) + 86400;


const tx = await c.issue(user.address, "ipfs://x", kycHash, validUntil);
await tx.wait();


const tokenId = 1;
expect(await c.isValid(tokenId)).to.eq(true);


await expect(c.connect(user).transferFrom(user.address, admin.address, tokenId))
.to.be.revertedWithCustomError(c, "TransferDisabled");


await (await c.setEmergencyFlag(tokenId, true)).wait();
const info = await c.info(tokenId);
expect(info.emergencyFlag).to.eq(true);
});
});