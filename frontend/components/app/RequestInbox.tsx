"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useApp, TOKENS } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { CONTRACTS, ZERO } from "@/lib/config";
import { fetchIncomingRequests, payNative, payErc20, type IncomingRequest } from "@/lib/onchain";
import { Icon } from "@/components/Icon";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const tokenMeta = (addr: string) => TOKENS.find((t) => (t.native && addr === ZERO) || t.address.toLowerCase() === addr.toLowerCase());
const keyOf = (r: IncomingRequest) => `${r.to}-${r.token}-${r.amount}-${r.note}`;

export function RequestInbox() {
  const { session, addTx } = useApp();
  const address = useEmbeddedWallet();
  const [items, setItems] = useState<IncomingRequest[]>([]);
  const [paid, setPaid] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(() => {
    if (!address || CONTRACTS.pay === ZERO) return;
    fetchIncomingRequests(address).then(setItems).catch(() => setItems([]));
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!session || items.length === 0) return null;
  const open = items.filter((r) => !paid.has(keyOf(r)));
  if (open.length === 0) return null;

  async function pay(r: IncomingRequest) {
    const tm = tokenMeta(r.token);
    if (!tm) return;
    const k = keyOf(r);
    setBusy(k);
    setMsg(null);
    try {
      const hash = tm.native
        ? await payNative(r.to, formatUnits(r.amount, tm.decimals), r.note)
        : await payErc20(tm.address, r.to, r.amount, r.note);
      addTx({ dir: "out", party: short(r.to), amount: +formatUnits(r.amount, tm.decimals), token: tm.symbol, note: r.note, hash });
      setPaid((p) => new Set(p).add(k));
      setMsg({ ok: true, text: "Paid — done." });
    } catch (e) {
      const x = e as { shortMessage?: string; message?: string };
      setMsg({ ok: false, text: x.shortMessage || x.message || "Payment failed." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="panel overflow-hidden p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <Icon name="arrowDownLeft" size={16} strokeWidth={2.4} />
        </span>
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-text">Payment requests</h2>
      </div>

      <div className="mt-3 space-y-2.5">
        {open.map((r) => {
          const tm = tokenMeta(r.token);
          const amt = tm ? +formatUnits(r.amount, tm.decimals) : 0;
          const label = tm?.symbol === "USDC" ? `$${amt.toFixed(2)}` : `${amt} ${tm?.symbol ?? ""}`;
          const k = keyOf(r);
          return (
            <div key={k} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "var(--surface-2)" }}>
              <div className="min-w-0">
                <div className="font-display text-lg font-bold text-text">{label}</div>
                <div className="truncate text-xs text-muted">{short(r.to)} requested{r.note ? ` · ${r.note}` : ""}</div>
              </div>
              <button onClick={() => pay(r)} disabled={busy === k} className="btn-primary ml-auto px-5 py-2.5 text-sm">
                {busy === k ? "Paying…" : "Pay"}
              </button>
            </div>
          );
        })}
      </div>

      {msg && <div className="mt-3 text-sm" style={{ color: msg.ok ? "var(--accent)" : "#ef4444" }}>{msg.text}</div>}
    </div>
  );
}
