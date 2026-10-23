import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { createPublicClient, createWalletClient, http, parseEther, isAddress, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const runtime = "nodejs";

// Server-side gas sponsor: drips a little zkLTC to a user's wallet so email/embedded
// wallets can transact without holding gas. RELAYER_PK is server-only (never shipped
// to the client). True ERC-4337 paymaster sponsorship can replace this once LiteForge
// AA infra (bundler/paymaster) is confirmed.
const RPC = process.env.LITEFORGE_RPC || process.env.NEXT_PUBLIC_LITEFORGE_RPC || "https://liteforge.rpc.caldera.xyz/http";
const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const APP_SECRET = process.env.PRIVY_APP_SECRET ?? "";

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

// One drip per account per window. In-memory, so it's per server instance —
// a speed bump on top of the sign-in + wallet-ownership checks, not the main guard.
const COOLDOWN_MS = 10 * 60_000;
const lastDrip = new Map<string, number>();

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  try {
    const pk = process.env.RELAYER_PK as `0x${string}` | undefined;
    if (!pk || !APP_SECRET) return fail("Gas sponsorship isn't configured.", 503);

    const { address } = await req.json();
    if (!isAddress(address)) return fail("Invalid wallet address.", 400);

    // 1) caller must be signed in…
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return fail("Sign in to get gas.", 401);
    const privy = new PrivyClient(APP_ID, APP_SECRET);
    let userId: string;
    try {
      userId = (await privy.verifyAuthToken(token)).userId;
    } catch {
      return fail("Your session expired — sign in again.", 401);
    }

    // 2) …and only fund a wallet linked to their own account
    const user = await privy.getUser(userId);
    const owns = user.linkedAccounts.some(
      (a) => a.type === "wallet" && a.address.toLowerCase() === address.toLowerCase()
    );
    if (!owns) return fail("That wallet isn't linked to your account.", 403);

    const pub = createPublicClient({ chain: litvm, transport: http() });
    const bal = await pub.getBalance({ address });
    if (bal >= MIN) return NextResponse.json({ ok: true, funded: false });

    const last = lastDrip.get(userId) ?? 0;
    if (Date.now() - last < COOLDOWN_MS) return fail("You were just topped up — try again in a few minutes.", 429);

    const account = privateKeyToAccount(pk);
    const relayerBal = await pub.getBalance({ address: account.address });
    if (relayerBal < DRIP) {
      console.error(`[gas] relayer ${account.address} is low: ${relayerBal} wei`);
      return fail("Free gas is temporarily unavailable — please try again later.", 503);
    }

    const wallet = createWalletClient({ account, chain: litvm, transport: http() });
    const hash = await wallet.sendTransaction({ to: address, value: DRIP });
    lastDrip.set(userId, Date.now());
    // wait so the caller's next tx doesn't race the top-up
    await pub.waitForTransactionReceipt({ hash });
    return NextResponse.json({ ok: true, funded: true, hash });
  } catch (e: unknown) {
    console.error("[gas]", e);
    return fail("Couldn't top up gas — try again in a moment.", 500);
  }
}
