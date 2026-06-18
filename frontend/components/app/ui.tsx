"use client";

import { Icon, type IconName } from "@/components/Icon";
import type { Tx } from "@/lib/store";

export function money(n: number, token = "USDC") {
  const v = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return token === "USDC" ? `$${v}` : `${v} ${token}`;
}

export function relTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function TxRow({ tx }: { tx: Tx }) {
  const out = tx.dir === "out";
  const req = tx.dir === "request";
  const icon: IconName = req ? "clock" : out ? "send" : "arrowDownLeft";
  const sign = out ? "−" : req ? "" : "+";
  const color = out ? "var(--text)" : req ? "var(--muted)" : "var(--positive)";
  return (
    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--field)", color: "var(--accent)" }}>
        <Icon name={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-text">{tx.party}</div>
        <div className="truncate text-[11px] text-muted">
          {tx.note || (req ? "requested" : out ? "sent" : "received")} · {relTime(tx.ts)}
          {tx.chain && tx.chain !== "LitVM" ? ` · → ${tx.chain}` : ""}
          {tx.status === "pending" ? " · pending" : ""}
          {tx.hash && (
            <>
              {" · "}
              <a href={`https://liteforge.hub.caldera.xyz/tx/${tx.hash}`} target="_blank" rel="noreferrer" className="text-accent underline">
                tx
              </a>
            </>
          )}
        </div>
      </div>
      <div className="ml-auto font-display font-bold" style={{ color }}>
        {sign}
        {money(tx.amount, tx.token)}
      </div>
    </div>
  );
}
