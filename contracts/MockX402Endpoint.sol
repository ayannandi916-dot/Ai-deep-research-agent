// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title  MockX402Endpoint
 * @notice Simulates an x402-protected data API on a local Hardhat Base fork.
 *
 *         Real x402 flow:
 *           1. Client hits API → server returns HTTP 402 with payment requirements
 *           2. Client signs a USDC payment permit
 *           3. Client retries with X-PAYMENT header
 *           4. Server settles on-chain, returns data + PAYMENT-RESPONSE header
 *
 *         This contract simulates step 4 — the on-chain settlement.
 *         Our x402-client-simple.ts / x402-client.ts call this contract
 *         directly in tests instead of hitting a live x402 API server.
 *
 *         Three agent roles tested:
 *           • web-search  → $0.001 per call  (Firecrawl simulation)
 *           • news        → $0.002 per call  (NewsAPI simulation)
 *           • academic    → $0.005 per call  (Semantic Scholar simulation)
 */
contract MockX402Endpoint is ReentrancyGuard {

    // ── State ────────────────────────────────────────────────────────────────

    IERC20  public immutable usdc;
    address public immutable owner;

    uint256 public pricePerCall;   // in USDC atomic units (6 decimals)
    uint256 public totalEarned;
    uint256 public callCount;

    // Per-caller tracking — used by tests to assert on individual agent wallets
    mapping(address => uint256) public agentCallCount;
    mapping(address => uint256) public agentTotalSpent;

    // ── Events ────────────────────────────────────────────────────────────────

    event DataServed(
        address indexed caller,
        uint256         amountPaid,
        string          dataKey,
        uint256 indexed callId,
        uint256         timestamp
    );
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawn(address indexed to, uint256 amount);

    // ── Errors ────────────────────────────────────────────────────────────────

    error InsufficientApproval(uint256 required, uint256 approved);
    error TransferFailed();
    error NotOwner();
    error ZeroPrice();
    error EmptyDataKey();

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _usdc, uint256 _pricePerCall) {
        if (_pricePerCall == 0) revert ZeroPrice();
        usdc         = IERC20(_usdc);
        owner        = msg.sender;
        pricePerCall = _pricePerCall;
    }

    // ── Core: paid data fetch ─────────────────────────────────────────────────

    /**
     * @notice  Agent calls this to pay and receive mock data.
     *          Agent must first call: usdc.approve(address(this), pricePerCall)
     *
     * @param   dataKey  The resource key being requested.
     *                   e.g. "web-search:EV+India+2025"
     *                        "news:AI+regulation"
     *                        "academic:transformer+architecture"
     *
     * @return  payload  Mock JSON string the agent parses as if it were a
     *                   real paid API response.
     */
    function fetch(string calldata dataKey)
        external
        nonReentrant
        returns (string memory payload)
    {
        if (bytes(dataKey).length == 0) revert EmptyDataKey();

        // Check allowance before attempting transfer
        uint256 approved = usdc.allowance(msg.sender, address(this));
        if (approved < pricePerCall) {
            revert InsufficientApproval(pricePerCall, approved);
        }

        // Pull payment from caller
        bool ok = usdc.transferFrom(msg.sender, address(this), pricePerCall);
        if (!ok) revert TransferFailed();

        // Update global stats
        callCount   += 1;
        totalEarned += pricePerCall;

        // Update per-agent stats
        agentCallCount[msg.sender]  += 1;
        agentTotalSpent[msg.sender] += pricePerCall;

        emit DataServed(
            msg.sender,
            pricePerCall,
            dataKey,
            callCount,
            block.timestamp
        );

        // Build and return mock JSON payload
        payload = string(abi.encodePacked(
            '{"status":"ok"',
            ',"dataKey":"',  dataKey,            '"',
            ',"price":',     _uint2str(pricePerCall),
            ',"callId":',    _uint2str(callCount),
            ',"block":',     _uint2str(block.number),
            ',"timestamp":', _uint2str(block.timestamp),
            ',"result":"Mock research data for: ', dataKey, '"',
            '}'
        ));
    }

    // ── Batch fetch (for agents doing multiple queries in one tx) ─────────────

    /**
     * @notice  Pay for multiple data keys in a single transaction.
     *          Agent must approve: usdc.approve(address(this), pricePerCall * dataKeys.length)
     */
    function fetchBatch(string[] calldata dataKeys)
        external
        nonReentrant
        returns (string[] memory payloads)
    {
        uint256 n     = dataKeys.length;
        uint256 total = pricePerCall * n;

        uint256 approved = usdc.allowance(msg.sender, address(this));
        if (approved < total) {
            revert InsufficientApproval(total, approved);
        }

        bool ok = usdc.transferFrom(msg.sender, address(this), total);
        if (!ok) revert TransferFailed();

        payloads = new string[](n);

        for (uint256 i = 0; i < n; i++) {
            callCount   += 1;
            totalEarned += pricePerCall;
            agentCallCount[msg.sender]  += 1;
            agentTotalSpent[msg.sender] += pricePerCall;

            emit DataServed(
                msg.sender,
                pricePerCall,
                dataKeys[i],
                callCount,
                block.timestamp
            );

            payloads[i] = string(abi.encodePacked(
                '{"status":"ok","callId":', _uint2str(callCount),
                ',"dataKey":"', dataKeys[i], '"',
                ',"result":"Batch data for: ', dataKeys[i], '"}'
            ));
        }
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setPrice(uint256 newPrice) external onlyOwner {
        if (newPrice == 0) revert ZeroPrice();
        emit PriceUpdated(pricePerCall, newPrice);
        pricePerCall = newPrice;
    }

    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = usdc.balanceOf(address(this));
        bool ok = usdc.transfer(owner, bal);
        if (!ok) revert TransferFailed();
        emit Withdrawn(owner, bal);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function contractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    function agentStats(address agent)
        external view
        returns (uint256 calls, uint256 spent)
    {
        return (agentCallCount[agent], agentTotalSpent[agent]);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    function _uint2str(uint256 v) internal pure returns (string memory) {
        if (v == 0) return "0";
        uint256 tmp = v;
        uint256 digits;
        while (tmp != 0) { digits++; tmp /= 10; }
        bytes memory buf = new bytes(digits);
        while (v != 0) {
            digits--;
            buf[digits] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        return string(buf);
    }
}