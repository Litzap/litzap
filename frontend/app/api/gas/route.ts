import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, isAddress, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Server-side gas sponsor: drips a little zkLTC to a user's wallet so email/embedded
// wallets can transact without holding gas. RELAYER_PK is server-only (never shipped
// to the client). True ERC-4337 paymaster sponsorship can replace this once LiteForge
// AA infra (bundler/paymaster) is confirmed.
const RPC = process.env.LITEFORGE_RPC || process.env.NEXT_PUBLIC_LITEFORGE_RPC || "https://liteforge.rpc.caldera.xyz/http";

const litvm = defineChain({
  id: 4441,
  name: "LiteForge",
  nativeCurrency: { name: "zkLTC", symbol: "zkLTC", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

// Real gas on LiteForge is tiny (<0.001/tx), but the wallet UI keeps a safety
// buffer and ERC-20 flows are two txs (approve + pay). 0.02 comfortably covers a
// full session while stretching the sponsor wallet's funds across many users.
const MIN = parseEther("0.01"); // top up whenever below this
const DRIP = parseEther("0.02"); // amount to send each top-up

export async function POST(req: Request) {
  try {
    const { address } = await req.json();
    if (!isAddress(address)) return NextResponse.json({ error: "bad address" }, { status: 400 });

    const pk = process.env.RELAYER_PK as `0x${string}` | undefined;
    if (!pk) return NextResponse.json({ error: "relayer not configured" }, { status: 500 });

    const pub = createPublicClient({ chain: litvm, transport: http() });
    const bal = await pub.getBalance({ address });
    if (bal >= MIN) return NextResponse.json({ ok: true, funded: false });

    const account = privateKeyToAccount(pk);
    const wallet = createWalletClient({ account, chain: litvm, transport: http() });
    const hash = await wallet.sendTransaction({ to: address, value: DRIP });
    return NextResponse.json({ ok: true, funded: true, hash });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error)?.message || "failed" }, { status: 500 });
  }
}
