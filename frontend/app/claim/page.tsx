"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MotionBackground } from "@/components/MotionBackground";
import { Zapster } from "@/components/Zapster";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/store";

export default function ClaimPage() {
  const { session } = useApp();
  const [hasSecret, setHasSecret] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setHasSecret(window.location.hash.length > 1);
  }, []);

  return (
    <div className="relative min-h-screen">
      <MotionBackground />
      <header className="mx-auto flex max-w-md items-center justify-between px-5 py-5">
        <Link href="/"><Logo /></Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-5 pt-8 text-center">
        <Zapster mood="success" size={190} />
        <h1 className="font-brand mt-2 text-3xl font-semibold text-text">
          Someone sent you <span className="gradient-text italic">money.</span>
        </h1>
        <p className="mt-3 max-w-sm text-muted">
          {hasSecret
            ? "A LitZap payment is waiting for you. Claim it to your wallet — or it auto-returns to the sender in 24h."
            : "This claim link looks incomplete. Ask the sender to share it again."}
        </p>

        <div className="panel mt-6 w-full p-6">
          {session ? (
            <button className="btn-primary w-full py-4 text-base" disabled={!hasSecret}>
              Claim to {session.username}.zap
            </button>
          ) : (
            <Link href="/#start" className="btn-primary block py-4 text-base">
              Create your LitZap to claim
            </Link>
          )}
          <p className="mt-3 text-xs text-muted">No seed phrase. 60-second setup.</p>
        </div>
      </main>
    </div>
  );
}
