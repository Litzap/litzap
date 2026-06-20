import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { createPublicClient, http, keccak256, encodeAbiParameters } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { recipientKey } from "@/lib/social";
import { escrowAbi } from "@/lib/abi";

export const runtime = "nodejs";

const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const APP_SECRET = process.env.PRIVY_APP_SECRET ?? "";
const RPC = process.env.NEXT_PUBLIC_LITEFORGE_RPC ?? "https://liteforge.rpc.caldera.xyz/http";
const ESCROW = (process.env.NEXT_PUBLIC_ESCROW ?? "") as `0x${string}`;
const RELAYER_PK = (process.env.RELAYER_PK ?? "") as `0x${string}`;
const CHAIN_ID = 4441n;

type EscrowView = {
  from: `0x${string}`;
  token: `0x${string}`;
  amount: bigint;
  expiry: bigint;
  recipientKey: `0x${string}`;
  settled: boolean;
};

export async function POST(req: Request) {
  try {
    if (!APP_SECRET || !RELAYER_PK || !ESCROW) {
      return NextResponse.json({ error: "Claim verification isn't configured yet." }, { status: 503 });
    }

    const { token, escrowId, to } = (await req.json()) as { token?: string; escrowId?: string; to?: `0x${string}` };
    if (!token || escrowId === undefined || !to) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // 1) verify the caller's Privy session and load their verified handles
    const privy = new PrivyClient(APP_ID, APP_SECRET);
    let userId: string;
    try {
      const claims = await privy.verifyAuthToken(token);
      userId = claims.userId;
    } catch {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    const user = await privy.getUser(userId);

    const email = user.email?.address ?? user.google?.email ?? undefined;
    const myKeys: string[] = [];
    if (user.twitter?.username) myKeys.push(recipientKey("x", user.twitter.username));
    if (user.discord?.username) myKeys.push(recipientKey("discord", user.discord.username));
    if (email) myKeys.push(recipientKey("email", email));
    if (myKeys.length === 0) {
      return NextResponse.json({ error: "Connect the matching X / Discord first." }, { status: 403 });
    }

    // 2) read the escrow on-chain and check ownership + state
    const client = createPublicClient({ transport: http(RPC) });
    const e = (await client.readContract({
      address: ESCROW,
      abi: escrowAbi,
      functionName: "getEscrow",
      args: [BigInt(escrowId)],
    })) as EscrowView;

    if (e.settled) return NextResponse.json({ error: "Already claimed or refunded." }, { status: 409 });
    if (BigInt(Math.floor(Date.now() / 1000)) > e.expiry) {
      return NextResponse.json({ error: "This payment expired and was returned to the sender." }, { status: 410 });
    }
    if (!myKeys.includes(e.recipientKey)) {
      return NextResponse.json({ error: "This payment isn't for your verified handle." }, { status: 403 });
    }

    // 3) sign a release bound to the claimant's payout address (front-run safe)
    const digest = keccak256(
      encodeAbiParameters(
        [{ type: "uint256" }, { type: "address" }, { type: "uint256" }, { type: "address" }],
        [CHAIN_ID, ESCROW, BigInt(escrowId), to]
      )
    );
    const account = privateKeyToAccount(RELAYER_PK);
    const signature = await account.signMessage({ message: { raw: digest } });

    return NextResponse.json({ signature });
  } catch (err) {
    return NextResponse.json({ error: (err as Error)?.message || "Claim failed." }, { status: 500 });
  }
}
