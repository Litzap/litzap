// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/// @title LitZapEscrow
/// @notice Open, composable escrow that powers LitZap's pay-by-social and
///         "hold-until-delivered" flows. It is a public primitive: ANY address
///         or contract (a person, a business, another LiteForge project) can
///         lock funds against an off-chain recipient identity and have them
///         released to the verified owner, or auto-refunded on expiry.
///
///         recipientKey = keccak256(bytes(lowercased identity)), e.g.
///         "x:bob", "discord:bob#0", "email:bob(at)host", "zap:bob".
///         The funded escrow reveals nothing about the recipient beyond this hash.
///
///         Release is gated by a trusted `signer` (the verification oracle) which
///         signs ONLY after confirming the claimant controls the identity. The
///         signature is bound to the claimant's payout address, so it cannot be
///         front-run or redirected. The signer can never move funds to itself.
///
///         Non-custodial guarantee: the only funds held are open escrows, and
///         every escrow is ALWAYS refundable by its funder after `expiry`.
contract LitZapEscrow is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    address public constant NATIVE = address(0);

    /// verification oracle authorized to release escrows to verified claimants
    address public signer;

    struct Escrow {
        address from;          // funder
        address token;         // NATIVE or ERC20
        uint256 amount;        // amount held
        uint64  expiry;        // after this, funder can refund
        bytes32 recipientKey;  // keccak256(identity)
        bool    settled;       // claimed or refunded (one-shot)
    }

    uint256 public nextId = 1;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(
        uint256 indexed id,
        address indexed from,
        bytes32 indexed recipientKey,
        address token,
        uint256 amount,
        uint64  expiry,
        string  note
    );
    event EscrowClaimed(uint256 indexed id, bytes32 indexed recipientKey, address indexed to);
    event EscrowRefunded(uint256 indexed id);
    event SignerUpdated(address signer);

    error WrongValue();
    error ZeroAmount();
    error BadExpiry();
    error Settled();
    error NotFunder();
    error NotExpired();
    error Expired();
    error BadSignature();
    error NoSigner();

    constructor(address _signer) Ownable(msg.sender) {
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    // ---------------------------------------------------------------
    // Create — lock funds for an off-chain identity. Permissionless.
    // ERC20 requires prior approve() to this contract.
    // ---------------------------------------------------------------
    function createEscrow(
        address token,
        uint256 amount,
        bytes32 recipientKey,
        uint64  expiry,
        string calldata note
    ) external payable nonReentrant whenNotPaused returns (uint256 id) {
        if (amount == 0) revert ZeroAmount();
        if (expiry <= block.timestamp) revert BadExpiry();

        if (token == NATIVE) {
            if (msg.value != amount) revert WrongValue();
        } else {
            if (msg.value != 0) revert WrongValue();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        id = nextId++;
        escrows[id] = Escrow({
            from: msg.sender,
            token: token,
            amount: amount,
            expiry: expiry,
            recipientKey: recipientKey,
            settled: false
        });
        emit EscrowCreated(id, msg.sender, recipientKey, token, amount, expiry, note);
    }

    // ---------------------------------------------------------------
    // Claim — release to the verified owner of the recipient identity.
    // `sig` is the oracle's signature over (chainid, this, id, to), so it is
    // bound to the payout address and cannot be replayed or front-run.
    // ---------------------------------------------------------------
    function claim(uint256 id, address to, bytes calldata sig)
        external
        nonReentrant
        whenNotPaused
    {
        Escrow storage e = escrows[id];
        if (e.settled) revert Settled();
        if (block.timestamp > e.expiry) revert Expired();
        if (signer == address(0)) revert NoSigner();

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encode(block.chainid, address(this), id, to))
        );
        if (digest.recover(sig) != signer) revert BadSignature();

        e.settled = true;
        _payout(e.token, to, e.amount);
        emit EscrowClaimed(id, e.recipientKey, to);
    }

    /// @notice Funder takes their money back after expiry if unclaimed.
    function refund(uint256 id) external nonReentrant {
        Escrow storage e = escrows[id];
        if (e.settled) revert Settled();
        if (msg.sender != e.from) revert NotFunder();
        if (block.timestamp <= e.expiry) revert NotExpired();
        e.settled = true;
        _payout(e.token, e.from, e.amount);
        emit EscrowRefunded(id);
    }

    // --- views ---
    function getEscrow(uint256 id) external view returns (Escrow memory) {
        return escrows[id];
    }

    // --- internal ---
    function _payout(address token, address to, uint256 amount) internal {
        if (token == NATIVE) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // --- admin ---
    function setSigner(address _signer) external onlyOwner {
        signer = _signer;
        emit SignerUpdated(_signer);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
