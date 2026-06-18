import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { defineChain } from "viem";

// LitVM / LiteForge testnet — Chain ID 4441, gas token zkLTC.
export const litvm = defineChain({
  id: 4441,
  name: "LitVM LiteForge",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_LITEFORGE_RPC ?? "https://liteforge.rpc.caldera.xyz/http"],
    },
  },
  testnet: true,
});

// Privy-managed wagmi config (no manual connectors — Privy provides the wallet).
export const wagmiConfig = createConfig({
  chains: [litvm],
  transports: { [litvm.id]: http() },
});

export const ZERO = "0x0000000000000000000000000000000000000000" as const;

export const CONTRACTS = {
  registry: (process.env.NEXT_PUBLIC_REGISTRY ?? ZERO) as `0x${string}`,
  pay: (process.env.NEXT_PUBLIC_PAY ?? ZERO) as `0x${string}`,
  capsule: (process.env.NEXT_PUBLIC_CAPSULE ?? ZERO) as `0x${string}`,
  subs: (process.env.NEXT_PUBLIC_SUBS ?? ZERO) as `0x${string}`,
  usdc: (process.env.NEXT_PUBLIC_USDC ?? ZERO) as `0x${string}`,
};

export const NATIVE = ZERO;
export const isLive = CONTRACTS.pay !== ZERO;
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
