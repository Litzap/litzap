"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatUnits } from "viem";
import { useApp, TOKENS } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { ZERO } from "@/lib/config";
import { getDropOnchain, claimDropOnchain, hasClaimedDrop, type DropInfo } from "@/lib/onchain";
import { MotionBackground } from "@/components/MotionBackground";
import { Zapster } from "@/components/Zapster";
import { Logo } from "@/components/Logo";

const tokenMeta = (addr: string) => TOKENS.find((t) => (t.native && addr === ZERO) || t.address.toLowerCase() === addr.toLowerCase());

export default function DropClaimPage() {
  const params = useParams();
  const code = String(params?.code ?? "");
  const { session } = useApp();
  const address = useEmbeddedWallet();

  const [drop, setDrop] = useState<DropInfo | null | undefined>(undefined);
  const [won, setWon] = useState<string | null>(null);
  const [already, setAlready] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function refresh() {
    setDrop(await getDropOnchain(code));
    if (address) setAlready(await hasClaimedDrop(code, address));
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [code, address]);

  const tm = drop ? tokenMeta(drop.token) : undefined;
  const left = drop ? drop.count - drop.claimed : 0;
  const expired = drop ? Date.now() / 1000 > Number(drop.expiry) : false;

  async function grab() {
    setErr("");
    setBusy(true);
    try {
      const { amount } = await claimDropOnchain(code);
      const txt = amount && tm ? `${tm.symbol === "USDC" ? "$" : ""}${(+formatUnits(amount, tm.decimals)).toFixed(tm.symbol === "USDC" ? 2 : 4)} ${tm.symbol === "USDC" ? "" : tm.symbol}`.trim() : "your share";
      setWon(txt);
    } catch (e) {
      const x = e as { shortMessage?: string; message?: string };
      setErr(x.shortMessage || x.message || "Couldn't grab this one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <MotionBackground />
      <header className="mx-auto flex max-w-md items-center justify-between px-5 py-5">
        <Link href="/"><Logo /></Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-5 pt-6 text-center">
        <Zapster mood={won != null ? "success" : "idle"} size={180} />

        {won != null ? (
          <>
            <h1 className="font-brand mt-2 text-3xl font-semibold text-text">
              You grabbed <span className="gradient-text italic">{won}</span>
            </h1>
            <Link href="/" className="btn-primary mt-6 inline-block px-6 py-3 text-sm">Open LitZap</Link>
          </>
        ) : (
          <>
            <h1 className="font-brand mt-2 text-3xl font-semibold text-text">
              {drop === undefined ? "Loading drop…" : drop ? "Someone dropped money" : "Drop not found"}
            </h1>
            {drop && (
              <p className="mt-2 text-muted">
                {left} share{left === 1 ? "" : "s"} left{expired ? " · expired" : ""}
              </p>
            )}
            <div className="panel mt-6 w-full p-6">
              {drop === undefined ? (
                <p className="text-muted">Checking the chain…</p>
              ) : !drop ? (
                <p className="text-muted">This drop link is invalid or expired.</p>
              ) : !session ? (
                <Link href="/#start" className="btn-primary block py-4 text-base">Sign in to grab your share</Link>
              ) : already ? (
                <p className="text-muted">You already grabbed your share from this drop.</p>
              ) : (
                <button onClick={grab} className="btn-primary w-full py-4 text-base disabled:opacity-50" disabled={busy || left <= 0 || expired}>
                  {busy ? "Grabbing on-chain…" : left > 0 && !expired ? "Grab my share" : "All gone"}
                </button>
              )}
              {err && <p className="mt-3 text-xs text-red-400">{err}</p>}
              <p className="mt-3 text-xs text-muted">No seed phrase. 60-second setup.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
