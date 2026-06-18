"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

// Temporary diagnostic: shows exactly what wallets Privy created + which wagmi is using.
export function WalletDebug() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();

  const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

  return (
    <div className="rounded-2xl p-4 text-[12px] leading-relaxed" style={{ background: "rgba(245,180,0,0.12)", color: "var(--text)", fontFamily: "ui-monospace, monospace" }}>
      <div className="font-bold">🔧 wallet debug (temporary)</div>
      <div>wagmi active: {short(address)}</div>
      <div>user.wallet: {short(user?.wallet?.address)} ({user?.wallet?.walletClientType ?? "none"})</div>
      <div>wallets ({wallets.length}):</div>
      {wallets.map((w, i) => (
        <div key={i}>· {w.walletClientType} — {short(w.address)}</div>
      ))}
      {wallets.length === 0 && <div>· (none)</div>}
    </div>
  );
}
