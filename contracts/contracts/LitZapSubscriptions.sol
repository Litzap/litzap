// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title LitZapSubscriptions
/// @notice Recurring payments, non-custodially. The payer keeps their funds in
///         their own wallet and grants an ERC20 allowance to this contract; when a
///         period is due, anyone (a keeper) can trigger a charge that pulls the
///         amount directly payer -> payee. The contract never holds funds, and the
///         payer can cancel anytime (or revoke the allowance) to stop it.
contract LitZapSubscriptions is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Sub {
        address payer;
        address payee;
        address token;    // ERC20 the payer has approved to this contract
        uint256 amount;
        uint64  interval; // seconds between charges
        uint64  nextDue;
        bool    active;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Sub) public subs;

    event Subscribed(uint256 indexed id, address indexed payer, address indexed payee, address token, uint256 amount, uint64 interval);
    event Charged(uint256 indexed id, uint256 amount, uint64 nextDue);
    event Cancelled(uint256 indexed id);

    error BadParams();
    error Inactive();
    error NotDue();
    error NotParty();

    /// @notice The payer creates and owns their subscription.
    function subscribe(address payee, address token, uint256 amount, uint64 interval) external returns (uint256 id) {
        if (amount == 0 || interval == 0 || payee == address(0)) revert BadParams();
        id = nextId++;
        subs[id] = Sub(msg.sender, payee, token, amount, interval, uint64(block.timestamp), true);
        emit Subscribed(id, msg.sender, payee, token, amount, interval);
    }

    /// @notice Anyone (typically a keeper) charges a due subscription. Funds move
    ///         payer -> payee directly via allowance; nothing is custodied here.
    function charge(uint256 id) external nonReentrant {
        Sub storage s = subs[id];
        if (!s.active) revert Inactive();
        if (block.timestamp < s.nextDue) revert NotDue();
        s.nextDue = uint64(block.timestamp) + s.interval;
        IERC20(s.token).safeTransferFrom(s.payer, s.payee, s.amount);
        emit Charged(id, s.amount, s.nextDue);
    }

    /// @notice Either party can stop it. (The payer can also just revoke the allowance.)
    function cancel(uint256 id) external {
        Sub storage s = subs[id];
        if (msg.sender != s.payer && msg.sender != s.payee) revert NotParty();
        s.active = false;
        emit Cancelled(id);
    }
}
