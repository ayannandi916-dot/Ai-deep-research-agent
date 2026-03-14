/**
 * Deploy the MockX402Endpoint contract and write its address
 * to hardhat/deployments.json for use in tests and the app.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-mock.ts --network baseSepolia
 *   npx hardhat run scripts/deploy-mock.ts --network hardhat
 */

import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

// 0.01 USDC (6 decimals)
const PRICE_PER_ACCESS = 10_000n;

// USDC addresses per network
const USDC: Record<string, string> = {
  hardhat: "", // filled at runtime (mocked)
  baseSepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  console.log(`Network: ${network.name}`);

  let usdcAddress = USDC[network.name];

  // On local hardhat, deploy a minimal ERC-20 mock first
  if (network.name === "hardhat" || !usdcAddress) {
    console.log("Deploying MockERC20 (local only)…");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mock = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mock.waitForDeployment();
    usdcAddress = await mock.getAddress();
    console.log(`MockERC20 deployed at: ${usdcAddress}`);
  }

  // Deploy the paywall contract
  console.log("Deploying MockX402Endpoint…");
  const Endpoint = await ethers.getContractFactory("MockX402Endpoint");
  const endpoint = await Endpoint.deploy(usdcAddress, PRICE_PER_ACCESS);
  await endpoint.waitForDeployment();

  const endpointAddress = await endpoint.getAddress();
  console.log(`MockX402Endpoint deployed at: ${endpointAddress}`);

  // Persist addresses
  const deploymentsPath = path.join(__dirname, "../hardhat/deployments.json");
  const existing = fs.existsSync(deploymentsPath)
    ? JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"))
    : {};

  existing[network.name] = {
    MockX402Endpoint: endpointAddress,
    USDC: usdcAddress,
    deployedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(deploymentsPath), { recursive: true });
  fs.writeFileSync(deploymentsPath, JSON.stringify(existing, null, 2));
  console.log(`Addresses saved to hardhat/deployments.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});