"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { useApp, TOKENS } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { CONTRACTS, ZERO } from "@/lib/config";
import { recipientKey } from "@/lib/social";
import { fetchPendingClaims, claimEscrow, type PendingEscrow } from "@/lib/onchain";
import { Icon } from "@/components/Icon";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const tokenMeta = (addr: string) =>
  TOKENS.find((t) => (t.native && addr === ZERO) || t.address.toLowerCase() === addr.toLowerCase());

export function ClaimInbox() {
  const { user, getAccessToken } = usePrivy();
  const { session, addTx } = useApp();
  const address = useEmbeddedWallet();
  const [items, setItems] = useState<PendingEscrow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const keys: `0x${string}`[] = [];
  if (user?.twitter?.username) keys.push(recipientKey("x", user.twitter.username));
  if (user?.discord?.username) keys.push(recipientKey("discord", user.discord.username));
  if (user?.email?.address) keys.push(recipientKey("email", user.email.address));
  const keySig = keys.join(",");

  const refresh = useCallback(() => {
    if (CONTRACTS.escrow === ZERO || keys.length === 0) {
      setItems([]);
      return;
    }
    fetchPendingClaims(keys).then(setItems).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySig]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!session || items.length === 0) return null;

  async function claimOne(it: PendingEscrow) {
    if (!address) return;
    setBusy(it.id.toString());
    setMsg(null);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, escrowId: it.id.toString(), to: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Claim failed.");
      await claimEscrow(it.id, address, data.signature);
      const tm = tokenMeta(it.token);
      addTx({
        dir: "in",
        party: short(it.from),
        amount: Number(formatUnits(it.amount, tm?.decimals ?? 18)),
        token: tm?.symbol ?? "?",
        note: it.note,
      });
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      setMsg({ ok: true, text: "Claimed — it's in your balance." });
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      setMsg({ ok: false, text: err.shortMessage || err.message || "Claim failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel overflow-hidden p-5" style={{ borderColor: "var(--accent)" }}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <Icon name="arrowDownLeft" size={16} strokeWidth={2.4} />
        </span>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-text">Money waiting for you</h2>
      </div>

      <div className="mt-3 space-y-2.5">
        {items.map((it) => {
          const tm = tokenMeta(it.token);
          const amt = Number(formatUnits(it.amount, tm?.decimals ?? 18));
          const label = tm?.symbol === "USDC" ? `$${amt.toFixed(2)}` : `${amt} ${tm?.symbol ?? ""}`;
          return (
            <div key={it.id.toString()} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
              <div className="min-w-0">
                <div className="font-display text-lg font-bold text-text">{label}</div>
                <div className="truncate text-xs text-muted">from {short(it.from)}{it.note ? ` · ${it.note}` : ""}</div>
              </div>
              <button
                onClick={() => claimOne(it)}
                disabled={busy === it.id.toString()}
                className="btn-primary ml-auto px-5 py-2.5 text-sm"
              >
                {busy === it.id.toString() ? "Claiming…" : "Claim"}
              </button>
            </div>
          );
        })}
      </div>

      {msg && (
        <div className="mt-3 text-sm" style={{ color: msg.ok ? "var(--accent)" : "#ef4444" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
