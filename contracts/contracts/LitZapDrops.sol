// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title LitZapDrops
/// @notice On-chain "red packet" drops: one funder locks a pot, and up to `count`
///         people each grab a share via a shared code. Equal or lucky (random) split.
///         Whatever isn't claimed by `expiry` is refundable to the creator.
///
///         A drop is keyed by codeHash = keccak256(bytes(code)); the human code is
///         shared off-chain (a link), and only its hash lives on-chain.
///
///         Non-custodial: the only funds held are open drops, and the creator can
///         always reclaim the unclaimed remainder after expiry.
contract LitZapDrops is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant NATIVE = address(0);

    struct Drop {
        address creator;
        address token;     // NATIVE or ERC20
        uint256 total;     // original pot
        uint256 remaining; // unclaimed balance
        uint32  count;     // max claimers
        uint32  claimed;   // how many have grabbed
        bool    lucky;     // true = random shares, false = equal
        uint64  expiry;    // after this, creator can reclaim
        bool    settled;   // creator reclaimed the remainder
    }

    mapping(bytes32 => Drop) public drops;                       // codeHash => drop
    mapping(bytes32 => mapping(address => bool)) public claimedBy;

    event DropCreated(bytes32 indexed codeHash, address indexed creator, address token, uint256 total, uint32 count, bool lucky, uint64 expiry);
    event DropClaimed(bytes32 indexed codeHash, address indexed by, uint256 amount);
    event DropReclaimed(bytes32 indexed codeHash, uint256 amount);

    error WrongValue();
    error BadParams();
    error CodeTaken();
    error NoDrop();
    error Expired();
    error AllGone();
    error AlreadyClaimed();
    error NotCreator();
    error NotExpired();
    error Settled();

    constructor() Ownable(msg.sender) {}

    function createDrop(
        bytes32 codeHash,
        address token,
        uint256 amount,
        uint32  count,
        bool    lucky,
        uint64  expiry
    ) external payable nonReentrant whenNotPaused {
        if (amount == 0 || count == 0) revert BadParams();
        if (expiry <= block.timestamp) revert BadParams();
        if (drops[codeHash].creator != address(0)) revert CodeTaken();

        if (token == NATIVE) {
            if (msg.value != amount) revert WrongValue();
        } else {
            if (msg.value != 0) revert WrongValue();
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        drops[codeHash] = Drop({
            creator: msg.sender,
            token: token,
            total: amount,
            remaining: amount,
            count: count,
            claimed: 0,
            lucky: lucky,
            expiry: expiry,
            settled: false
        });
        emit DropCreated(codeHash, msg.sender, token, amount, count, lucky, expiry);
    }

    function claim(bytes32 codeHash) external nonReentrant whenNotPaused {
        Drop storage d = drops[codeHash];
        if (d.creator == address(0)) revert NoDrop();
        if (block.timestamp > d.expiry) revert Expired();
        if (d.claimed >= d.count) revert AllGone();
        if (claimedBy[codeHash][msg.sender]) revert AlreadyClaimed();

        uint32 left = d.count - d.claimed;
        uint256 share;
        if (left == 1) {
            share = d.remaining; // last claimer sweeps the dust
        } else if (!d.lucky) {
            share = d.total / d.count;
            if (share > d.remaining) share = d.remaining;
        } else {
            // pseudo-random share, bounded so everyone left can still get >= 1 wei.
            // Not cryptographically secure — acceptable for a fun, low-value feature.
            uint256 maxShare = (d.remaining - (left - 1));
            uint256 cap = (d.remaining * 2) / left; // average * 2
            if (cap < 1) cap = 1;
            if (maxShare > cap) maxShare = cap;
            uint256 rnd = uint256(
                keccak256(abi.encodePacked(block.prevrandao, block.timestamp, codeHash, msg.sender, d.claimed))
            );
            share = (rnd % maxShare) + 1;
        }

        d.claimed += 1;
        d.remaining -= share;
        claimedBy[codeHash][msg.sender] = true;

        _payout(d.token, msg.sender, share);
        emit DropClaimed(codeHash, msg.sender, share);
    }

    function reclaim(bytes32 codeHash) external nonReentrant {
        Drop storage d = drops[codeHash];
        if (d.creator == address(0)) revert NoDrop();
        if (msg.sender != d.creator) revert NotCreator();
        if (block.timestamp <= d.expiry) revert NotExpired();
        if (d.settled) revert Settled();
        uint256 amt = d.remaining;
        d.settled = true;
        d.remaining = 0;
        if (amt > 0) _payout(d.token, d.creator, amt);
        emit DropReclaimed(codeHash, amt);
    }

    function getDrop(bytes32 codeHash) external view returns (Drop memory) {
        return drops[codeHash];
    }

    function _payout(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == NATIVE) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "native transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
