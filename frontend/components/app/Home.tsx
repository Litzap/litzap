"use client";

import { motion } from "framer-motion";
import { useBalance } from "wagmi";
import { useApp } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { CONTRACTS, ZERO } from "@/lib/config";
import { Icon, type IconName } from "@/components/Icon";
import { Zapster } from "@/components/Zapster";
import { TxRow } from "./ui";
import { AskZapster } from "./AskZapster";
import { ConnectSocials } from "./ConnectSocials";
import { ClaimInbox } from "./ClaimInbox";
import { RequestInbox } from "./RequestInbox";

const ACTIONS: { id: "send" | "request" | "receive"; icon: IconName; label: string }[] = [
  { id: "send", icon: "send", label: "Send" },
  { id: "request", icon: "arrowDownLeft", label: "Request" },
  { id: "receive", icon: "qr", label: "Receive" },
];

export function Home() {
  const { session, txs, setView } = useApp();
  const address = useEmbeddedWallet();
  const hasUsdc = CONTRACTS.usdc !== ZERO;
  const { data: usdc } = useBalance({ address, token: hasUsdc ? CONTRACTS.usdc : undefined, query: { enabled: hasUsdc } });
  const { data: ltc } = useBalance({ address });
  if (!session) return null;

  const held: { text: string }[] = [];
  if (usdc && +usdc.formatted > 0) held.push({ text: `$${(+usdc.formatted).toFixed(2)}` });
  if (ltc && +ltc.formatted > 0) held.push({ text: `${(+ltc.formatted).toFixed(3)} ${ltc.symbol}` });
  const headline = held[0]?.text ?? "$0.00";
  const rest = held.slice(1);

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back</p>
          <h1 className="font-brand text-3xl font-semibold text-text">{session.username}.zap</h1>
        </div>
        <Zapster mood="idle" size={92} />
      </div>

      <ClaimInbox />
      <RequestInbox />

      {/* real on-chain balance */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="panel overflow-hidden p-7">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Balance · on LitVM</p>
        <p className="font-display mt-1 text-4xl font-extrabold text-text md:text-5xl">{headline}</p>
        {held.length === 0 ? (
          <p className="mt-1 text-xs text-muted">No funds yet — tap Receive to add money.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {rest.map((r) => (
              <span key={r.text} className="rounded-full px-3 py-1 text-xs text-muted" style={{ background: "var(--surface-2)" }}>{r.text}</span>
            ))}
            <span className="rounded-full px-3 py-1 text-xs text-muted" style={{ background: "var(--surface-2)" }}>Live on-chain · non-custodial</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => setView(a.id)} className="btn-primary flex flex-col items-center gap-1.5 py-3.5 text-xs font-bold">
              <Icon name={a.icon} size={18} strokeWidth={2} />
              {a.label}
            </button>
          ))}
        </div>
      </motion.div>

      <AskZapster />

      <ConnectSocials />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-muted">Activity</h2>
          {txs.length > 0 && (
            <button onClick={() => setView("activity")} className="text-xs font-semibold text-accent">See all</button>
          )}
        </div>
        {txs.length === 0 ? (
          <div className="rounded-2xl px-4 py-10 text-center text-sm text-muted" style={{ background: "var(--surface-2)" }}>
            No activity yet. Your payments will show up here.
          </div>
        ) : (
          <div className="space-y-2">
            {txs.slice(0, 5).map((t) => (
              <TxRow key={t.id} tx={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
