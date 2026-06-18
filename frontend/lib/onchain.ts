import { writeContract, readContract, waitForTransactionReceipt } from "wagmi/actions";
import { parseEther } from "viem";
import { wagmiConfig, CONTRACTS, NATIVE, ZERO } from "./config";
import { registryAbi, payAbi, erc20Abi } from "./abi";

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
