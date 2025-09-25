import * as fs from "fs";
import * as path from "path";


const artifactPath = path.join(__dirname, "../artifacts/contracts/TouristID.sol/TouristID.json");
const outPath = path.join(__dirname, "../abi/TouristID.json");


function main() {
if (!fs.existsSync(artifactPath)) {
console.error("Artifact not found. Run `npm run compile` first.");
process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;
fs.writeFileSync(outPath, JSON.stringify(abi, null, 2));
console.log("ABI exported to:", outPath);
}


main();