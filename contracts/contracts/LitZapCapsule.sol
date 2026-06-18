// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title LitZapCapsule
/// @notice Mint a reusable "Zap Capsule" (a saved money program) as an NFT you
///         own and can share. Non-custodial: holds no funds, just ownership + metadata.
contract LitZapCapsule is ERC721, Ownable {
    uint256 public nextId = 1;
    mapping(uint256 => string) public capsuleName; // e.g. "Auto-Stash"
    mapping(uint256 => string) private _uri;

    event CapsuleMinted(uint256 indexed id, address indexed owner, string name);

    constructor() ERC721("LitZap Capsule", "ZAPCAP") Ownable(msg.sender) {}

    /// @notice Mint a capsule to yourself.
    function mint(string calldata name, string calldata uri) external returns (uint256 id) {
        id = nextId++;
        _safeMint(msg.sender, id);
        capsuleName[id] = name;
        _uri[id] = uri;
        emit CapsuleMinted(id, msg.sender, name);
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        _requireOwned(id);
        return _uri[id];
    }
}
