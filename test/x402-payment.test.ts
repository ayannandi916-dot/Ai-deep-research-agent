/**
 * Integration test for the X-402 payment flow against the deployed
 * MockX402Endpoint on a local Hardhat node.
 *
 * Prerequisites:
 *   1. Run `npx hardhat node` in a separate terminal
 *   2. Run `npx hardhat run scripts/deploy-mock.ts --network hardhat`
 *   3. Run `npx hardhat run scripts/fund-wallet.ts --network hardhat`
 *   4. Set AGENT_PRIVATE_KEY and USDC_ADDRESS in .env
 */

import { describe, it, expect, beforeAll } from "vitest";
import { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { parseChallenge, payChallenge } from "../src/payment/x402-client-simple";
import { getUSDCBalance } from "../src/payment/wallet";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadDeployments() {
  const p = path.join(__dirname, "../hardhat/deployments.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("X-402 payment flow (Hardhat local)", () => {
  let endpointAddress: string;
  let usdcAddress: string;

  beforeAll(() => {
    const deployments = loadDeployments();
    endpointAddress = deployments.hardhat?.MockX402Endpoint;
    usdcAddress = deployments.hardhat?.USDC;

    if (!endpointAddress || !usdcAddress) {
      throw new Error(
        "Deployments not found. Run deploy-mock.ts first."
      );
    }
  });

  it("agent wallet has USDC balance after funding", async () => {
    const balance = await getUSDCBalance();
    expect(balance).toBeGreaterThan(0);
  });

  it("parseChallenge extracts payee, amount and nonce from headers", () => {
    const headers = new Headers({
      "X-Payment-Required": JSON.stringify({
        payee: "0xDeadBeef00000000000000000000000000000001",
        amount: "0.01",
        nonce: "abc-123",
      }),
    });

    const challenge = parseChallenge(headers, "http://localhost/test");

    expect(challenge.payee).toBe("0xDeadBeef00000000000000000000000000000001");
    expect(challenge.amountUSDC).toBe(0.01);
    expect(challenge.nonce).toBe("abc-123");
    expect(challenge.endpoint).toBe("http://localhost/test");
  });

  it("parseChallenge throws when header is missing", () => {
    expect(() => parseChallenge(new Headers(), "http://localhost/test")).toThrow(
      /X-Payment-Required/
    );
  });

  it("pays the MockX402Endpoint contract and emits PaymentReceived", async () => {
    const [owner] = await ethers.getSigners();

    // Attach contracts
    const endpoint = await ethers.getContractAt(
      "MockX402Endpoint",
      endpointAddress
    );
    const usdc = await ethers.getContractAt("MockERC20", usdcAddress);

    const price: bigint = await endpoint.pricePerAccess();
    const nonce = `nonce-${Date.now()}`;

    // Approve the endpoint to pull USDC
    await usdc.connect(owner).approve(endpointAddress, price);

    // Pay
    const tx = await endpoint.connect(owner).pay(nonce, price);
    const receipt = await tx.wait();

    // Verify event
    const event = receipt?.logs.find((log: { fragment?: { name: string } }) =>
      log.fragment?.name === "PaymentReceived"
    );
    expect(event).toBeDefined();
  });

  it("rejects a replayed nonce", async () => {
    const [owner] = await ethers.getSigners();
    const endpoint = await ethers.getContractAt(
      "MockX402Endpoint",
      endpointAddress
    );
    const usdc = await ethers.getContractAt("MockERC20", usdcAddress);

    const price: bigint = await endpoint.pricePerAccess();
    const nonce = `replay-nonce-${Date.now()}`;

    // First payment (should succeed)
    await usdc.connect(owner).approve(endpointAddress, price * 2n);
    await endpoint.connect(owner).pay(nonce, price);

    // Replay (should revert)
    await expect(
      endpoint.connect(owner).pay(nonce, price)
    ).rejects.toThrow(/nonce already used/);
  });

  it("rejects payment with wrong amount", async () => {
    const [owner] = await ethers.getSigners();
    const endpoint = await ethers.getContractAt(
      "MockX402Endpoint",
      endpointAddress
    );
    const usdc = await ethers.getContractAt("MockERC20", usdcAddress);

    const wrongAmount = 1n; // 0.000001 USDC
    const nonce = `wrong-amount-${Date.now()}`;

    await usdc.connect(owner).approve(endpointAddress, wrongAmount);

    await expect(
      endpoint.connect(owner).pay(nonce, wrongAmount)
    ).rejects.toThrow(/wrong amount/);
  });
});