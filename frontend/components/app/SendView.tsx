"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isAddress, parseUnits } from "viem";
import { useApp, TOKENS, DEFAULT_TOKEN } from "@/lib/store";
import { ZERO, isLive, CONTRACTS } from "@/lib/config";
import { payNative, payErc20, resolveName, createSocialEscrow } from "@/lib/onchain";
import { recipientKey, type SocialKind } from "@/lib/social";
import { Icon, type IconName } from "@/components/Icon";
import { Zapster, type Mood } from "@/components/Zapster";

type Kind = "tag" | "email" | "x" | "discord";
const TABS: { kind: Kind; label: string; icon: IconName; placeholder: string }[] = [
  { kind: "tag", label: "ZapTag / address", icon: "at", placeholder: "name.zap or 0x address" },
  { kind: "email", label: "Email", icon: "mail", placeholder: "their@email.com" },
  { kind: "x", label: "X", icon: "x", placeholder: "@handle on X" },
  { kind: "discord", label: "Discord", icon: "discord", placeholder: "their Discord username" },
];
const EXPLORER = "https://liteforge.hub.caldera.xyz/tx/";
const CLAIM_DAYS = 7;

export function SendView() {
  const { addTx } = useApp();
  const [kind, setKind] = useState<Kind>("tag");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenSym, setTokenSym] = useState(DEFAULT_TOKEN);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<Mood>("idle");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; hash?: string } | null>(null);

  const token = TOKENS.find((t) => t.symbol === tokenSym)!;
  const tab = TABS.find((t) => t.kind === kind)!;
  const isSocial = kind !== "tag";

  async function submit() {
    setResult(null);
    const amt = parseFloat(amount);
    if (!to.trim()) return setResult({ ok: false, msg: "Who are you paying?" });
    if (!amt || amt <= 0) return setResult({ ok: false, msg: "Enter an amount." });
    if (!isLive) return setResult({ ok: false, msg: "On-chain contracts not configured." });
    if (!token.native && token.address === ZERO) return setResult({ ok: false, msg: `${token.symbol} address not configured.` });
    if (isSocial && CONTRACTS.escrow === ZERO) return setResult({ ok: false, msg: "Pay-by-social isn't configured yet." });

    setMood("idle");
    setBusy(true);
    try {
      const units = parseUnits(String(amt), token.decimals);

      if (!isSocial) {
        // direct payment to a ZapTag or address
        const v = to.trim();
        let dest: `0x${string}`;
        if (isAddress(v)) dest = v as `0x${string}`;
        else {
          const name = v.replace(/^@/, "").replace(/\.zap$/, "").toLowerCase();
          dest = await resolveName(name);
          if (!dest || dest === ZERO) throw new Error(`${name}.zap isn't registered yet.`);
        }
        const hash = token.native
          ? await payNative(dest, String(amt), note)
          : await payErc20(token.address, dest, units, note);
        addTx({ dir: "out", party: v, amount: amt, token: token.symbol, note, hash });
        setMood("zap");
        setResult({ ok: true, msg: `Sent ${amt} ${token.symbol} to ${v}.`, hash });
      } else {
        // pay-by-social: lock in escrow until they verify the handle
        const handle = to.trim().replace(/^@/, "").toLowerCase();
        const key = recipientKey(kind as SocialKind, handle);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + CLAIM_DAYS * 86400);
        const { hash } = await createSocialEscrow({
          token: token.address,
          native: token.native,
          amount: units,
          recipientKey: key,
          expiry,
          note,
        });
        addTx({ dir: "out", party: `${kind}:${handle}`, amount: amt, token: token.symbol, note, hash });
        setMood("zap");
        setResult({
          ok: true,
          msg: `Locked ${amt} ${token.symbol} for ${handle} on ${tab.label}. They claim it after connecting ${tab.label} on LitZap — auto-refunds to you in ${CLAIM_DAYS} days if unclaimed.`,
          hash,
        });
      }

      setTo("");
      setAmount("");
      setNote("");
    } catch (e: unknown) {
      setMood("broke");
      setResult({ ok: false, msg: (e as { shortMessage?: string })?.shortMessage || (e as Error)?.message || "Transaction failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-brand text-4xl font-semibold text-text">Send money</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Real on-chain payments on LitVM — to a ZapTag, an address, or someone's X / Discord.</p>

        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t.kind} onClick={() => { setKind(t.kind); setResult(null); }} className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition" style={{ background: kind === t.kind ? "var(--accent-ring)" : "var(--field)", color: kind === t.kind ? "var(--accent)" : "var(--muted)" }}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder={tab.placeholder} className="field mb-4 px-5 py-3.5 text-sm" />
        <div className="mb-4 flex items-center gap-2 rounded-full pr-2" style={{ background: "var(--field)" }}>
          <div className="flex flex-1 items-center px-5">
            <span className="font-display text-lg font-bold text-muted">{token.symbol === "USDC" ? "$" : ""}</span>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" className="font-display w-full bg-transparent py-3.5 pl-1 text-lg font-bold outline-none" />
          </div>
          <select value={tokenSym} onChange={(e) => setTokenSym(e.target.value)} className="rounded-full px-3 py-2 text-sm font-semibold outline-none" style={{ background: "var(--surface-2)", color: "var(--text)" }}>
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>{t.symbol}</option>
            ))}
          </select>
        </div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className="field mb-4 px-5 py-3 text-sm" />

        {isSocial && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-xs text-muted" style={{ background: "var(--surface-2)" }}>
            They don't need an account yet. Your money is locked safely on-chain and released only to the verified owner of <b>{tab.label}</b> — or returned to you after {CLAIM_DAYS} days.
          </div>
        )}

        <button onClick={submit} disabled={busy} className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-base">
          <Icon name="send" size={18} strokeWidth={2} />
          {busy ? (isSocial ? "Locking on-chain…" : "Sending on-chain…") : isSocial ? `Send to ${tab.label}` : "Send"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-2xl px-4 py-3 text-sm" style={{ background: result.ok ? "var(--accent-ring)" : "rgba(239,68,68,0.12)", color: result.ok ? "var(--text)" : "#ef4444" }}>
              <div>{result.msg}</div>
              {result.hash && (
                <a href={`${EXPLORER}${result.hash}`} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] text-accent underline">
                  View on explorer
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden items-start justify-center md:flex">
        <Zapster mood={mood} size={220} />
      </div>
    </div>
  );
}
