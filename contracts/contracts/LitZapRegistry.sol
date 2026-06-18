// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title LitZapRegistry
/// @notice Maps human @usernames to wallet addresses so people pay a name,
///         not a 0x string. One primary name per address. Non-custodial: this
///         contract never touches funds — it's pure identity.
contract LitZapRegistry is Ownable {
    /// keccak(name) => owner address
    mapping(bytes32 => address) public ownerOfName;
    /// address => its primary username (raw, lowercased string)
    mapping(address => string) public nameOf;
    /// names the protocol reserves (brand, abuse, squatting)
    mapping(bytes32 => bool) public reserved;

    uint256 public minLength = 3;
    uint256 public maxLength = 20;

    event Registered(string name, address indexed owner);
    event Released(string name, address indexed prevOwner);

    error NameTaken();
    error InvalidName();
    error NotNameOwner();
    error AlreadyHasName();

    constructor() Ownable(msg.sender) {}

    function _key(string memory name) internal pure returns (bytes32) {
        return keccak256(bytes(name));
    }

    /// @dev enforce [a-z0-9_] and length bounds; frontend lowercases first
    function _validate(string memory name) internal view {
        bytes memory b = bytes(name);
        if (b.length < minLength || b.length > maxLength) revert InvalidName();
        for (uint256 i; i < b.length; ++i) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) // a-z
                || (c >= 0x30 && c <= 0x39)     // 0-9
                || c == 0x5f;                   // _
            if (!ok) revert InvalidName();
        }
    }

    /// @notice Claim a @username for msg.sender.
    function register(string calldata name) external {
        if (bytes(nameOf[msg.sender]).length != 0) revert AlreadyHasName();
        _validate(name);
        bytes32 k = _key(name);
        if (ownerOfName[k] != address(0) || reserved[k]) revert NameTaken();
        ownerOfName[k] = msg.sender;
        nameOf[msg.sender] = name;
        emit Registered(name, msg.sender);
    }

    /// @notice Give up a name you own (frees it + clears your primary).
    function release(string calldata name) external {
        bytes32 k = _key(name);
        if (ownerOfName[k] != msg.sender) revert NotNameOwner();
        delete ownerOfName[k];
        delete nameOf[msg.sender];
        emit Released(name, msg.sender);
    }

    /// @notice Resolve a @username to an address (address(0) if unclaimed).
    function resolve(string calldata name) external view returns (address) {
        return ownerOfName[_key(name)];
    }

    // --- admin ---
    function setReserved(string calldata name, bool isReserved) external onlyOwner {
        reserved[_key(name)] = isReserved;
    }

    function setLengths(uint256 _min, uint256 _max) external onlyOwner {
        minLength = _min;
        maxLength = _max;
    }
}
