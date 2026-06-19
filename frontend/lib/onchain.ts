import { writeContract, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseEther, createPublicClient, http, parseAbiItem, decodeEventLog } from "viem";
import { wagmiConfig, CONTRACTS, NATIVE, ZERO, litvm } from "./config";
import { registryAbi, payAbi, erc20Abi, escrowAbi } from "./abi";

/** Read who owns a ZapTag (zero address = available). */
export async function resolveName(name: string): Promise<`0x${string}`> {
  return (await readContract(wagmiConfig, {
    address: CONTRACTS.registry,
    abi: registryAbi,
    functionName: "resolve",
    args: [name],
  })) as `0x${string}`;
}

export async function isNameAvailable(name: string): Promise<boolean> {
  const a = await resolveName(name);
  return !a || a === ZERO;
}

/** The ZapTag this address already owns on-chain (empty string if none). */
export async function nameOfAddress(addr: `0x${string}`): Promise<string> {
  return (await readContract(wagmiConfig, {
    address: CONTRACTS.registry,
    abi: registryAbi,
    functionName: "nameOf",
    args: [addr],
  })) as string;
}

/** Register a ZapTag on-chain (requires a connected wallet on chain 4441). */
export async function registerName(name: string): Promise<`0x${string}`> {
  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.registry,
    abi: registryAbi,
    functionName: "register",
    args: [name],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

/** Release a ZapTag you own (frees it). Signs with the active wallet. */
export async function releaseName(name: string): Promise<`0x${string}`> {
  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.registry,
    abi: registryAbi,
    functionName: "release",
    args: [name],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

/** Send native zkLTC through LitZapPay (requires a connected wallet). */
export async function payNative(to: `0x${string}`, amount: string, note = ""): Promise<`0x${string}`> {
  const value = parseEther(amount);
  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.pay,
    abi: payAbi,
    functionName: "pay",
    args: [to, NATIVE, value, note],
    value,
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

/** Send an ERC-20 (e.g. USDC) through LitZapPay: approve then pay. `amount` is in base units. */
export async function payErc20(token: `0x${string}`, to: `0x${string}`, amount: bigint, note = ""): Promise<`0x${string}`> {
  const approveHash = await writeContract(wagmiConfig, {
    address: token,
    abi: erc20Abi,
    functionName: "approve",
    args: [CONTRACTS.pay, amount],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });

  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.pay,
    abi: payAbi,
    functionName: "pay",
    args: [to, token, amount, note],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

// ---------------------------------------------------------------
// Pay-by-social escrow (LitZapEscrow)
// ---------------------------------------------------------------

export type PendingEscrow = {
  id: bigint;
  from: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  expiry: bigint;
  recipientKey: `0x${string}`;
  note: string;
};

const publicClient = createPublicClient({ chain: litvm, transport: http() });

const ESCROW_CREATED = parseAbiItem(
  "event EscrowCreated(uint256 indexed id, address indexed from, bytes32 indexed recipientKey, address token, uint256 amount, uint64 expiry, string note)"
);

/** Lock funds for an off-chain identity. `amount` is in base units. ERC-20 is approved first. */
export async function createSocialEscrow(p: {
  token: `0x${string}`;
  native: boolean;
  amount: bigint;
  recipientKey: `0x${string}`;
  expiry: bigint;
  note?: string;
}): Promise<{ hash: `0x${string}`; id?: bigint }> {
  const { token, native, amount, recipientKey, expiry, note = "" } = p;

  if (!native) {
    const approveHash = await writeContract(wagmiConfig, {
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACTS.escrow, amount],
    });
    await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
  }

  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.escrow,
    abi: escrowAbi,
    functionName: "createEscrow",
    args: [native ? NATIVE : token, amount, recipientKey, expiry, note],
    value: native ? amount : 0n,
  });
  const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });

  let id: bigint | undefined;
  for (const log of receipt.logs) {
    try {
      const d = decodeEventLog({ abi: escrowAbi, data: log.data, topics: log.topics });
      if (d.eventName === "EscrowCreated") {
        id = (d.args as { id: bigint }).id;
        break;
      }
    } catch {
      /* not our event */
    }
  }
  return { hash, id };
}

/** Claim an escrow with the verifier's signature, paying out to `to`. */
export async function claimEscrow(id: bigint, to: `0x${string}`, sig: `0x${string}`): Promise<`0x${string}`> {
  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.escrow,
    abi: escrowAbi,
    functionName: "claim",
    args: [id, to, sig],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

/** Funder reclaims an expired, unclaimed escrow. */
export async function refundEscrow(id: bigint): Promise<`0x${string}`> {
  const hash = await writeContract(wagmiConfig, {
    address: CONTRACTS.escrow,
    abi: escrowAbi,
    functionName: "refund",
    args: [id],
  });
  await waitForTransactionReceipt(wagmiConfig, { hash });
  return hash;
}

/** Find open (unsettled, unexpired) escrows addressed to any of these identity keys. */
export async function fetchPendingClaims(recipientKeys: `0x${string}`[]): Promise<PendingEscrow[]> {
  if (CONTRACTS.escrow === ZERO || recipientKeys.length === 0) return [];
  try {
    const logs = await publicClient.getLogs({
      address: CONTRACTS.escrow,
      event: ESCROW_CREATED,
      args: { recipientKey: recipientKeys },
      fromBlock: 0n,
      toBlock: "latest",
    });
    const now = BigInt(Math.floor(Date.now() / 1000));
    const out: PendingEscrow[] = [];
    for (const l of logs) {
      const id = l.args.id as bigint;
      const e = (await readContract(wagmiConfig, {
        address: CONTRACTS.escrow,
        abi: escrowAbi,
        functionName: "getEscrow",
        args: [id],
      })) as { token: `0x${string}`; amount: bigint; expiry: bigint; recipientKey: `0x${string}`; settled: boolean; from: `0x${string}` };
      if (!e.settled && now < e.expiry) {
        out.push({ id, from: e.from, token: e.token, amount: e.amount, expiry: e.expiry, recipientKey: e.recipientKey, note: (l.args.note as string) ?? "" });
      }
    }
    return out;
  } catch {
    return [];
  }
}
