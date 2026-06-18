"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { MotionBackground } from "@/components/MotionBackground";
import { Zapster } from "@/components/Zapster";
import { Logo } from "@/components/Logo";
import { money } from "@/components/app/ui";

export default function DropClaimPage() {
  const params = useParams();
  const code = String(params?.code ?? "");
  const { session, getDrop, claimDrop } = useApp();
  const drop = getDrop(code);
  const [won, setWon] = useState<{ amount: number; token: string } | null>(null);
  const [err, setErr] = useState("");

  function grab() {
    const r = claimDrop(code);
    if (r.ok) setWon({ amount: r.amount, token: r.token });
    else setErr(r.error);
  }

  const left = drop ? drop.count - drop.claims.length : 0;

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
              You grabbed <span className="gradient-text italic">{money(won.amount, won.token)}</span>
            </h1>
            <Link href="/" className="btn-primary mt-6 inline-block px-6 py-3 text-sm">Open LitZap</Link>
          </>
        ) : (
          <>
            <h1 className="font-brand mt-2 text-3xl font-semibold text-text">
              {drop ? `${drop.from}.zap dropped money` : "Drop not found"}
            </h1>
            {drop && (
              <p className="mt-2 text-muted">
                {drop.note ? `“${drop.note}” · ` : ""}
                {left} share{left === 1 ? "" : "s"} left
              </p>
            )}
            <div className="panel mt-6 w-full p-6">
              {!drop ? (
                <p className="text-muted">This drop link is invalid or expired.</p>
              ) : session ? (
                <button onClick={grab} className="btn-primary w-full py-4 text-base" disabled={left <= 0}>
                  {left > 0 ? "Grab my share" : "All gone"}
                </button>
              ) : (
                <Link href="/#start" className="btn-primary block py-4 text-base">Sign in to grab your share</Link>
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
