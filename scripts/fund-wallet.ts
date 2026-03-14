/**
 * Fund the agent wallet with mock USDC on the local Hardhat node.
 * Reads the agent address from AGENT_PRIVATE_KEY and mints tokens
 * from the MockERC20 deployed in deployments.json.
 *
 * Usage:
 *   npx hardhat run scripts/fund-wallet.ts --network hardhat
 */

import "dotenv/config";
import { ethers, network } from "hardhat";
import { privateKeyToAccount } from "viem/accounts";
import fs from "fs";
import path from "path";

const MINT_AMOUNT = ethers.parseUnits("10", 6); // 10 USDC

async function main() {
  if (!process.env.AGENT_PRIVATE_KEY) {
    throw new Error("AGENT_PRIVATE_KEY env var is required");
  }

  // Derive agent address from private key
  const account = privateKeyToAccount(
    process.env.AGENT_PRIVATE_KEY as `0x${string}`
  );
  const agentAddress = account.address;
  console.log(`Agent address: ${agentAddress}`);

  // Load deployments
  const deploymentsPath = path.join(__dirname, "../hardhat/deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      "hardhat/deployments.json not found. Run deploy-mock.ts first."
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const usdcAddress: string = deployments[network.name]?.USDC;

  if (!usdcAddress) {
    throw new Error(`No USDC address found for network: ${network.name}`);
  }

  console.log(`USDC contract: ${usdcAddress}`);

  // Get signer (deployer/owner of MockERC20)
  const [owner] = await ethers.getSigners();

  // Attach to MockERC20 and mint
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const usdc = MockERC20.attach(usdcAddress);

  const tx = await usdc.connect(owner).mint(agentAddress, MINT_AMOUNT);
  await tx.wait();

  const balance = await usdc.balanceOf(agentAddress);
  console.log(
    `Agent funded! Balance: ${ethers.formatUnits(balance, 6)} USDC`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});