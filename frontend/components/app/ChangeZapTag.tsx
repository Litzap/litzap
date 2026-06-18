"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useApp } from "@/lib/store";
import { ZERO } from "@/lib/config";
import { resolveName, registerName, releaseName, nameOfAddress } from "@/lib/onchain";
import { Icon } from "@/components/Icon";

async function dripGas(address: string) {
  try {
    await fetch("/api/gas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address }) });
  } catch {}
}

export function ChangeZapTag() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { signIn } = useApp();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const canonicalAddr = user?.wallet?.address?.toLowerCase();
  const canonicalWallet = wallets.find((w) => w.address.toLowerCase() === canonicalAddr);

  async function change() {
    const u = name.trim().replace(/^@/, "").replace(/\.zap$/, "").toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return setMsg("3–20 letters, numbers or _");
    if (!canonicalWallet) return setMsg("Wallet not ready — try again in a moment.");
    setMsg("");
    setBusy(true);
    try {
      const owner = await resolveName(u);
      const ownerLc = owner?.toLowerCase();
      if (owner && owner !== ZERO && ownerLc !== canonicalAddr) {
        const mine = wallets.find((w) => w.address.toLowerCase() === ownerLc);
        if (!mine) {
          setMsg(`${u}.zap is already taken.`);
          setBusy(false);
          return;
        }
        // it's on one of your other wallets — free it
        await setActiveWallet(mine);
        await dripGas(mine.address);
        await releaseName(u);
      }
      // on your main wallet: drop current name, claim the new one
      await setActiveWallet(canonicalWallet);
      await dripGas(canonicalWallet.address);
      const cur = await nameOfAddress(canonicalWallet.address as `0x${string}`);
      if (cur && cur.toLowerCase() !== u) await releaseName(cur);
      const after = await nameOfAddress(canonicalWallet.address as `0x${string}`);
      if (after.toLowerCase() !== u) await registerName(u);

      signIn({ method: "email", username: u, email: user?.email?.address, socials: {}, address: canonicalWallet.address });
      setMsg(`Done — you're now ${u}.zap`);
      setName("");
    } catch (e: unknown) {
      setMsg((e as { shortMessage?: string })?.shortMessage || (e as Error)?.message || "Failed — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel mt-5 p-5">
      <h3 className="font-display text-sm font-bold text-text">Change your ZapTag</h3>
      <p className="mb-3 mt-0.5 text-xs text-muted">Pick a new name. If you own one already, it's swapped on-chain.</p>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-full px-5" style={{ background: "var(--field)" }}>
          <input value={name} onChange={(e) => { setName(e.target.value); setMsg(""); }} placeholder="newname" className="w-full bg-transparent py-3 text-sm outline-none" />
          <span className="font-semibold text-accent">.zap</span>
        </div>
        <button onClick={change} disabled={busy} className="btn-primary flex items-center gap-1.5 px-5 py-3 text-sm">
          {busy ? "Working…" : "Change"}
        </button>
      </div>
      {msg && <p className="mt-2.5 text-[11px] text-accent">{msg}</p>}
    </div>
  );
}
