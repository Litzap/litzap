import { keccak256, toBytes } from "viem";

export type SocialKind = "x" | "discord" | "email";

/**
 * Deterministic on-chain key for an off-chain identity, shared by the sender
 * (creating an escrow) and the verifier (releasing it). MUST match on both
 * sides. recipientKey = keccak256("<kind>:<lowercased handle, no @>").
 */
export function recipientKey(kind: SocialKind, handle: string): `0x${string}` {
  const h = handle.trim().toLowerCase().replace(/^@/, "");
  return keccak256(toBytes(`${kind}:${h}`));
}
