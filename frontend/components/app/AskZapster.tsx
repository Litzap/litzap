"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBalance } from "wagmi";
import { isAddress, parseUnits } from "viem";
import { useApp, TOKENS } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { CONTRACTS, ZERO, isLive } from "@/lib/config";
import { payNative, payErc20, resolveName, createSocialEscrow } from "@/lib/onchain";
import { recipientKey, type SocialKind } from "@/lib/social";
import { ZapsterFace } from "@/components/Zapster";
import { Icon } from "@/components/Icon";
import { money } from "./ui";

type Action = {
  kind: "send" | "social" | "request";
  recipientType: "tag" | "address" | "x" | "discord";
  recipient: string; // display (name / address / handle)
  tokenSym: string;
  amount: number;
  note?: string;
  summary: string;
};
type Msg = { who: "you" | "zap"; text: string; hash?: string };
type Tone = "playful" | "balanced" | "professional";

const COLORS = ["#5b86ff", "#7b5bff", "#15a34a", "#ff7a59", "#ff4d8d", "#f5b400"];
const EXPLORER = "https://liteforge.hub.caldera.xyz/tx/";
const CLAIM_HOURS = 24;

const GREET: Record<Tone, string> = {
  playful: "Zapster here. Tell me what to do — like “send 5 USDC to maya.zap”.",
  balanced: "Hey, I'm Zapster. Tell me what to do — e.g. “send 5 USDC to maya.zap”.",
  professional: "Zapster, your money assistant. Try “send 5 USDC to maya.zap”.",
};
const HELP: Record<Tone, string> = {
  playful: "Just tell me: “send 20 to maya.zap”, “pay @jules 10 on x”, “request 15 from sam”, or “what's my balance”. I'll set it up — you confirm.",
  balanced: "I can send money, pay an X/Discord handle, request money, and check balances. Tell me in plain words and I'll prepare it for your confirmation.",
  professional: "I can execute payments, pay social handles, create requests, and report balances. State the instruction; I'll prepare it for confirmation.",
};

export function AskZapster() {
  const { txs, session, addTx, request } = useApp();
  const address = useEmbeddedWallet();
  const { data: usdc } = useBalance({ address, token: CONTRACTS.usdc !== ZERO ? CONTRACTS.usdc : undefined, query: { enabled: !!address && CONTRACTS.usdc !== ZERO } });
  const { data: ltc } = useBalance({ address });

  const [tone, setTone] = useState<Tone>("playful");
  const [color, setColor] = useState(COLORS[0]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<Msg[]>([{ who: "zap", text: GREET.playful }]);
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("litzap.aitone") as Tone | null;
      const c = localStorage.getItem("litzap.aicolor");
      if (t && GREET[t]) { setTone(t); setLog([{ who: "zap", text: GREET[t] }]); }
      if (c) setColor(c);
    } catch {}
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [log, pending]);

  function setToneP(t: Tone) { setTone(t); try { localStorage.setItem("litzap.aitone", t); } catch {} }
  function setColorP(c: string) { setColor(c); try { localStorage.setItem("litzap.aicolor", c); } catch {} }

  function say(text: string, hash?: string) {
    setLog((l) => [...l, { who: "zap", text, hash }]);
  }

  // ---- parse a plain-language command into an Action or a text reply ----
  function handle(text: string) {
    const t = text.toLowerCase();

    if (/what can you|^help|who are you|capab/.test(t)) return say(HELP[tone]);
    if (/balance|how much.*(have|left|got|i have)/.test(t)) {
      const u = usdc ? +usdc.formatted : 0;
      const l = ltc ? +ltc.formatted : 0;
      const parts = [];
      if (u > 0) parts.push(`$${u.toFixed(2)} USDC`);
      if (l > 0) parts.push(`${l.toFixed(4)} ${ltc?.symbol ?? "zkLTC"}`);
      return say(parts.length ? `You have ${parts.join(" and ")}.` : "Your balance is empty right now — add funds from Receive.");
    }
    if (/who.*owe|owes me|pending/.test(t)) {
      const r = txs.filter((x) => x.dir === "request" && x.status === "pending");
      return say(r.length ? `Waiting on ${r.map((x) => `${x.party} (${money(x.amount, x.token)})`).join(", ")}.` : "Nobody owes you anything right now.");
    }
    if (/\bdrop\b/.test(t)) return say("Drops live in the Drops tab — open it to split a pot across a group.");

    // money command
    const amount = parseFloat((t.match(/(\d+(?:\.\d+)?)/) || [])[1]);
    const tokenSym = /\bzk?ltc\b/.test(t) ? "zkLTC" : "USDC";
    const note = (text.match(/\bfor\s+(.+)$/i) || [])[1]?.trim();
    const isRequest = /\brequest\b|\bask\b/.test(t);

    const addr = (text.match(/0x[a-fA-F0-9]{40}/) || [])[0];
    const at = (text.match(/@([a-z0-9_.]+)/i) || [])[1];
    const zap = (text.match(/\b([a-z0-9_]+)\.zap\b/i) || [])[1];
    const onDiscord = /discord/.test(t);
    const onX = /\bon x\b|x\.com|twitter|\bx:/.test(t);

    let recipientType: Action["recipientType"] | null = null;
    let recipient = "";
    if (addr) { recipientType = "address"; recipient = addr; }
    else if (onDiscord && at) { recipientType = "discord"; recipient = at; }
    else if (onX && at) { recipientType = "x"; recipient = at; }
    else if (zap) { recipientType = "tag"; recipient = zap; }
    else if (at) { recipientType = "tag"; recipient = at; } // bare @name → ZapTag

    if (!amount || amount <= 0) return say("How much should I send? Try “send 10 USDC to maya.zap”.");
    if (!recipientType) return say("Who am I paying? Give me a name.zap, an address, or a handle (e.g. “@jules on x”).");

    const tokLabel = tokenSym === "USDC" ? `$${amount.toFixed(2)}` : `${amount} zkLTC`;
    const dest =
      recipientType === "address" ? `${recipient.slice(0, 6)}…${recipient.slice(-4)}`
      : recipientType === "tag" ? `${recipient}.zap`
      : `${recipient} on ${recipientType === "x" ? "X" : "Discord"}`;

    const action: Action = {
      kind: isRequest ? "request" : recipientType === "x" || recipientType === "discord" ? "social" : "send",
      recipientType, recipient, tokenSym, amount, note,
      summary: `${isRequest ? "Request" : "Send"} ${tokLabel} ${isRequest ? "from" : "to"} ${dest}${note ? ` · ${note}` : ""}`,
    };
    setLog((l) => [...l, { who: "zap", text: "Here's what I'll do — confirm and I'll run it on-chain:" }]);
    setPending(action);
  }

  async function confirm() {
    if (!pending) return;
    const a = pending;
    setBusy(true);
    try {
      const token = TOKENS.find((t) => t.symbol === a.tokenSym)!;
      if (a.kind === "request") {
        request({ from: a.recipient, amount: a.amount, token: a.tokenSym, note: a.note });
        setPending(null);
        say(`Requested ${a.tokenSym === "USDC" ? `$${a.amount.toFixed(2)}` : `${a.amount} ${a.tokenSym}`} from ${a.recipient}.`);
        return;
      }
      if (!address) throw new Error("Your wallet is still loading — try again in a second.");
      if (!isLive) throw new Error("On-chain contracts aren't configured.");
      const units = parseUnits(String(a.amount), token.decimals);

      if (a.kind === "send") {
        let to: `0x${string}`;
        if (a.recipientType === "address" && isAddress(a.recipient)) to = a.recipient as `0x${string}`;
        else {
          to = await resolveName(a.recipient.toLowerCase());
          if (!to || to === ZERO) throw new Error(`${a.recipient}.zap isn't registered yet.`);
        }
        const hash = token.native ? await payNative(to, String(a.amount), a.note) : await payErc20(token.address, to, units, a.note);
        addTx({ dir: "out", party: a.recipientType === "tag" ? `${a.recipient}.zap` : a.recipient, amount: a.amount, token: a.tokenSym, note: a.note, hash });
        setPending(null);
        say(`Done — sent ${a.tokenSym === "USDC" ? `$${a.amount.toFixed(2)}` : `${a.amount} ${a.tokenSym}`}.`, hash);
      } else {
        if (CONTRACTS.escrow === ZERO) throw new Error("Pay-by-social isn't configured yet.");
        const key = recipientKey(a.recipientType as SocialKind, a.recipient);
        const expiry = BigInt(Math.floor(Date.now() / 1000) + CLAIM_HOURS * 3600);
        const { hash } = await createSocialEscrow({ token: token.address, native: token.native, amount: units, recipientKey: key, expiry, note: a.note });
        addTx({ dir: "out", party: `${a.recipientType}:${a.recipient}`, amount: a.amount, token: a.tokenSym, note: a.note, hash });
        setPending(null);
        say(`Locked it for ${a.recipient} — they claim after verifying, or it returns to you in ${CLAIM_HOURS}h.`, hash);
      }
    } catch (e) {
      const err = e as { shortMessage?: string; message?: string };
      say(err.shortMessage || err.message || "That didn't go through.");
      setPending(null);
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const msg = input.trim();
    if (!msg || busy) return;
    setLog((l) => [...l, { who: "you", text: msg }]);
    setInput("");
    setPending(null);
    handle(msg);
  }

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <ZapsterFace size={30} />
        <span className="font-display text-sm font-bold" style={{ color }}>Zapster</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ background: `${color}22`, color }}>your AI</span>
        <button onClick={() => setShowCustomize((s) => !s)} className="ml-auto text-xs font-semibold text-muted hover:text-text">
          {showCustomize ? "Done" : "Customize"}
        </button>
      </div>

      <AnimatePresence>
        {showCustomize && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden rounded-2xl p-3" style={{ background: "var(--surface-2)" }}>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Personality</div>
            <div className="mb-3 flex gap-2">
              {(["playful", "balanced", "professional"] as Tone[]).map((tt) => (
                <button key={tt} onClick={() => setToneP(tt)} className="flex-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition" style={{ background: tone === tt ? `${color}22` : "var(--field)", color: tone === tt ? color : "var(--muted)" }}>
                  {tt}
                </button>
              ))}
            </div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Color</div>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setColorP(c)} className="h-7 w-7 rounded-full transition" style={{ background: c, outline: color === c ? `2px solid var(--text)` : "none", outlineOffset: 2 }} aria-label={c} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scroller} className="mb-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {log.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${m.who === "you" ? "justify-end" : "justify-start"}`}>
              {m.who === "zap" && <ZapsterFace size={26} />}
              <span className="max-w-[82%] rounded-2xl px-3.5 py-2 text-sm" style={m.who === "you" ? { background: "var(--surface-2)", color: "var(--text)" } : { background: `${color}1a`, color: "var(--text)", borderLeft: `3px solid ${color}` }}>
                {m.text}
                {m.hash && (
                  <a href={`${EXPLORER}${m.hash}`} target="_blank" rel="noreferrer" className="mt-1 block text-[11px] text-accent underline">View on explorer</a>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* confirm card */}
        <AnimatePresence>
          {pending && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="rounded-2xl p-3.5" style={{ background: "var(--surface-2)", border: `1px solid ${color}` }}>
              <div className="font-display text-sm font-bold text-text">{pending.summary}</div>
              <div className="mt-2.5 flex gap-2">
                <button onClick={confirm} disabled={busy} className="btn-primary flex-1 py-2.5 text-sm">{busy ? "Working…" : "Confirm"}</button>
                <button onClick={() => { setPending(null); say("Okay, cancelled."); }} disabled={busy} className="flex-1 rounded-full py-2.5 text-sm font-semibold" style={{ background: "var(--field)", color: "var(--muted)" }}>Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 rounded-full px-4" style={{ background: "var(--field)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Tell Zapster what to do — e.g. send 20 to maya.zap" className="w-full bg-transparent py-3 text-sm outline-none" />
        <button onClick={submit} title="Send" style={{ color }}>
          <Icon name="arrowRight" size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
