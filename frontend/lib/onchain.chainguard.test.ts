import { describe, it, expect, vi, beforeEach } from "vitest";

// Regression guard for the listing-blocker bug: external wallets (MetaMask etc.)
// could be sitting on Ethereum mainnet, so every on-chain write MUST (a) switch
// the wallet to LitVM (4441) and (b) pin chainId so a tx can never be submitted
// on the wrong network. These tests assert that contract, not the implementation.

// vi.mock factories are hoisted above the module body, so the mock fns must be
// created via vi.hoisted to exist when the factory runs.
const { writeContract, switchChain, getAccount, waitForTransactionReceipt, readContract } = vi.hoisted(() => ({
  writeContract: vi.fn(async () => "0xhash" as `0x${string}`),
  switchChain: vi.fn(async () => ({})),
  getAccount: vi.fn(() => ({ chainId: 1, status: "connected" })), // default: connected on Ethereum mainnet
  waitForTransactionReceipt: vi.fn(async () => ({ logs: [] })),
  readContract: vi.fn(async () => "0x0000000000000000000000000000000000000000"),
}));

vi.mock("wagmi/actions", () => ({
  writeContract,
  switchChain,
  getAccount,
  waitForTransactionReceipt,
  readContract,
}));

// Mock the config so we don't pull in Privy/wagmi provider setup. litvm keeps a
// valid rpcUrls so onchain.ts's module-level createPublicClient() doesn't throw.
vi.mock("@/lib/config", () => {
  const ZERO = "0x0000000000000000000000000000000000000000";
  return {
    litvm: { id: 4441, name: "LitVM", nativeCurrency: { name: "z", symbol: "z", decimals: 18 }, rpcUrls: { default: { http: ["http://localhost:8545"] } } },
    wagmiConfig: {},
    NATIVE: ZERO,
    ZERO,
    CONTRACTS: {
      registry: "0x1111111111111111111111111111111111111111",
      pay: "0x2222222222222222222222222222222222222222",
      escrow: "0x3333333333333333333333333333333333333333",
      drops: "0x4444444444444444444444444444444444444444",
      usdc: "0x5555555555555555555555555555555555555555",
    },
  };
});

vi.mock("@/lib/abi", () => ({
  registryAbi: [],
  payAbi: [],
  erc20Abi: [],
  escrowAbi: [],
  dropsAbi: [],
}));

import { payNative, registerName } from "@/lib/onchain";

const LITVM = 4441;
const dest = "0x6666666666666666666666666666666666666666" as `0x${string}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("chain guard — every write is pinned to LitVM (4441)", () => {
  it("switches to LitVM when the wallet is on the wrong chain, and pins chainId", async () => {
    getAccount.mockReturnValue({ chainId: 1, status: "connected" }); // connected on mainnet
    await payNative(dest, "1", "gm");

    expect(switchChain).toHaveBeenCalledWith(expect.anything(), { chainId: LITVM });
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract.mock.calls[0][1]).toMatchObject({ chainId: LITVM });
  });

  it("does not re-switch when already on LitVM, but still pins chainId", async () => {
    getAccount.mockReturnValue({ chainId: LITVM, status: "connected" });
    await registerName("zapster");

    expect(switchChain).not.toHaveBeenCalled();
    expect(writeContract.mock.calls[0][1]).toMatchObject({ chainId: LITVM });
  });

  it("does not attempt a chain switch when no wallet is connected", async () => {
    // Embedded Privy wallets are pinned to LitVM; switching while disconnected
    // would throw a misleading "Connector not connected" before the write.
    getAccount.mockReturnValue({ chainId: undefined, status: "disconnected" });
    await payNative(dest, "1");

    expect(switchChain).not.toHaveBeenCalled();
    expect(writeContract.mock.calls[0][1]).toMatchObject({ chainId: LITVM });
  });

  it("never submits a write without an explicit LitVM chainId", async () => {
    getAccount.mockReturnValue({ chainId: 137, status: "connected" }); // connected on another chain
    await payNative(dest, "0.5");

    for (const call of writeContract.mock.calls) {
      expect(call[1].chainId).toBe(LITVM);
    }
  });
});
