// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IShieldAdapter
/// @notice Pluggable privacy backend for LitZap (the "Ghost Mode" engine).
///         A shield adapter routes a payment through a confidentiality mechanism
///         so amounts and/or recipients are hidden. Possible backends:
///           - "mweb-bridge": peg value into Litecoin MWEB via the omnichain
///             bridge, using a stealth address (confidential amounts + recipient)
///           - "zk-pool":     an on-chain ZK shielded pool (note commitments)
///
///         LitZapPay calls the *configured, whitelisted* adapter when a user
///         turns on Ghost Mode. Swapping the backend (e.g. when LitVM publishes
///         its MWEB integration endpoint) requires NO change to the payment core
///         — only allowlisting a new adapter address. This keeps privacy honest:
///         we never claim shielding the active backend can't actually deliver.
interface IShieldAdapter {
    /// @param token                NATIVE (address(0)) or ERC20
    /// @param amount               gross amount handed to the adapter
    /// @param recipientCommitment  backend-defined recipient data:
    ///                             MWEB → stealth address / peg-out instruction;
    ///                             ZK   → note commitment
    /// @return ok                  whether the shielded transfer was accepted
    function shieldedSend(
        address token,
        uint256 amount,
        bytes calldata recipientCommitment
    ) external payable returns (bool ok);

    /// @notice Backend identifier, e.g. "mweb-bridge" / "zk-pool-v1".
    function backendId() external view returns (string memory);

    /// @notice What this backend actually hides, so the UI can label honestly.
    /// @return hidesAmount     true if transfer amount is confidential
    /// @return hidesRecipient  true if recipient is unlinkable on the public ledger
    function privacyProfile() external view returns (bool hidesAmount, bool hidesRecipient);
}
