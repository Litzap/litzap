"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { TxRow } from "./ui";

const FILTERS = ["all", "in", "out", "request"] as const;
type Filter = (typeof FILTERS)[number];

export function ActivityView() {
  const { txs } = useApp();
  const [f, setF] = useState<Filter>("all");
  const shown = txs.filter((t) => (f === "all" ? true : t.dir === f));

  return (
    <div className="max-w-2xl">
      <h1 className="font-brand text-3xl font-extrabold text-text">Activity</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Every payment, request, and private send.</p>

      <div className="mb-5 flex gap-2">
        {FILTERS.map((x) => (
          <button
            key={x}
            onClick={() => setF(x)}
            className="rounded-full px-4 py-1.5 text-xs font-bold capitalize transition"
            style={{
              background: f === x ? "var(--accent-ring)" : "var(--field)",
              color: f === x ? "var(--accent)" : "var(--muted)",
            }}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {shown.length === 0 ? (
          <div className="rounded-2xl px-4 py-10 text-center text-sm text-muted" style={{ background: "var(--surface-2)" }}>
            Nothing here yet.
          </div>
        ) : (
          shown.map((t) => <TxRow key={t.id} tx={t} />)
        )}
      </div>
    </div>
  );
}
