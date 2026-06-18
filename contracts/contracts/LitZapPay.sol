// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title LitZapPay
/// @notice Non-custodial open payments for LitZap.
///         - pay():        direct transfer, funds pass straight through
///         - request():    emits a request signal the recipient app picks up
///         - createClaim(): "Boomerang" — send-to-claim, auto-returns if unclaimed
///
///         The only funds this contract ever holds are open Boomerang claims,
///         and those can ALWAYS be reclaimed by the sender after expiry. We never
///         take custody of a completed payment.
contract LitZapPay is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev sentinel for the native gas token (LTC-equivalent on LitVM)
    address public constant NATIVE = address(0);

    /// protocol fee in basis points (100 = 1%), hard-capped so we can never rug
    uint16 public feeBps;
    uint16 public constant MAX_FEE_BPS = 100; // 1% ceiling, enforced forever
    address public feeRecipient;

    struct Claim {
        address from;       // who funded it
        address token;      // NATIVE or ERC20
        uint256 amount;     // net amount claimable (fee already taken)
        uint64  expiry;     // after this, only `from` can reclaim
        bytes32 secretHash; // keccak256(secret); claimant reveals secret
        bool    settled;    // claimed or reclaimed (one-shot)
    }

    uint256 public nextClaimId = 1;
    mapping(uint256 => Claim) public claims;

    event Payment(address indexed from, address indexed to, address token, uint256 amount, uint256 fee, string note);
    event PaymentRequested(address indexed to, address indexed from, address token, uint256 amount, string note);
    event ClaimCreated(uint256 indexed id, address indexed from, address token, uint256 amount, uint64 expiry);
    event ClaimClaimed(uint256 indexed id, address indexed to);
    event ClaimReclaimed(uint256 indexed id);
    event FeeUpdated(uint16 feeBps, address feeRecipient);

    error WrongValue();
    error FeeTooHigh();
    error ClaimSettled();
    error BadSecret();
    error NotExpired();
    error NotClaimSender();
    error Expired();

    constructor(address _feeRecipient, uint16 _feeBps) Ownable(msg.sender) {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    // ---------------------------------------------------------------
    // Direct payment — non-custodial, funds pass straight through.
    // ERC20 requires prior approve() to this contract.
    // ---------------------------------------------------------------
    function pay(address to, address token, uint256 amount, string calldata note)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        uint256 fee = (amount * feeBps) / 10_000;
        uint256 net = amount - fee;

        if (token == NATIVE) {
            if (msg.value != amount) revert WrongValue();
            if (fee > 0) _sendNative(feeRecipient, fee);
            _sendNative(to, net);
        } else {
            if (msg.value != 0) revert WrongValue();
            IERC20(token).safeTransferFrom(msg.sender, to, net);
            if (fee > 0) IERC20(token).safeTransferFrom(msg.sender, feeRecipient, fee);
        }
        emit Payment(msg.sender, to, token, net, fee, note);
    }

    /// @notice Ask someone to pay you. Pure signal — no funds move.
    function request(address from, address token, uint256 amount, string calldata note)
        external
        whenNotPaused
    {
        emit PaymentRequested(msg.sender, from, token, amount, note);
    }

    // ---------------------------------------------------------------
    // Boomerang: send-to-claim with auto-return.
    // secretHash = keccak256(secret). Deliver `secret` to the recipient
    // out-of-band (e.g. the app verifies their X/Discord, then hands them the
    // secret). They reveal it to claim. If unclaimed past expiry, sender reclaims.
    //
    // NOTE (known MVP limitation): revealing the secret on-chain is front-runnable
    // — a watcher could submit claim() to their own `to` first. Acceptable when a
    // trusted relayer submits the claim; production should bind the claim to a
    // recipient signature (commit-reveal). Tracked for hardening.
    // ---------------------------------------------------------------
    function createClaim(address token, uint256 amount, uint64 expiry, bytes32 secretHash)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 id)
    {
        uint256 fee = (amount * feeBps) / 10_000;
        uint256 net = amount - fee;

        if (token == NATIVE) {
            if (msg.value != amount) revert WrongValue();
            if (fee > 0) _sendNative(feeRecipient, fee);
        } else {
            if (msg.value != 0) revert WrongValue();
            IERC20(token).safeTransferFrom(msg.sender, address(this), net);
            if (fee > 0) IERC20(token).safeTransferFrom(msg.sender, feeRecipient, fee);
        }

        id = nextClaimId++;
        claims[id] = Claim({
            from: msg.sender,
            token: token,
            amount: net,
            expiry: expiry,
            secretHash: secretHash,
            settled: false
        });
        emit ClaimCreated(id, msg.sender, token, net, expiry);
    }

    /// @notice Claim a Boomerang by revealing its secret, sending funds to `to`.
    function claim(uint256 id, bytes calldata secret, address to)
        external
        nonReentrant
        whenNotPaused
    {
        Claim storage c = claims[id];
        if (c.settled) revert ClaimSettled();
        if (block.timestamp > c.expiry) revert Expired();
        if (keccak256(secret) != c.secretHash) revert BadSecret();
        c.settled = true;
        _payout(c.token, to, c.amount);
        emit ClaimClaimed(id, to);
    }

    /// @notice Sender takes their money back after expiry if nobody claimed.
    function reclaim(uint256 id) external nonReentrant {
        Claim storage c = claims[id];
        if (c.settled) revert ClaimSettled();
        if (msg.sender != c.from) revert NotClaimSender();
        if (block.timestamp <= c.expiry) revert NotExpired();
        c.settled = true;
        _payout(c.token, c.from, c.amount);
        emit ClaimReclaimed(id);
    }

    // --- internal ---
    function _payout(address token, address to, uint256 amount) internal {
        if (token == NATIVE) _sendNative(to, amount);
        else IERC20(token).safeTransfer(to, amount);
    }

    function _sendNative(address to, uint256 amount) internal {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "native transfer failed");
    }

    // --- admin ---
    function setFee(uint16 _feeBps, address _feeRecipient) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeeUpdated(_feeBps, _feeRecipient);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
