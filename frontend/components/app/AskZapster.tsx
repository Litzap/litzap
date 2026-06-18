"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBalance } from "wagmi";
import { useApp } from "@/lib/store";
import { ZapsterFace } from "@/components/Zapster";
import { Icon } from "@/components/Icon";
import { money } from "./ui";

type Msg = { who: "you" | "zap"; text: string };
type Tone = "playful" | "balanced" | "professional";

const COLORS = ["#5b86ff", "#7b5bff", "#15a34a", "#ff7a59", "#ff4d8d", "#f5b400"];

const GREET: Record<Tone, string> = {
  playful: "Zapster here. Who are we paying?",
  balanced: "Hey — I'm Zapster. What do you need?",
  professional: "Zapster, your money assistant. How can I help?",
};
const FLAIR: Record<Tone, string> = { playful: "Too easy.", balanced: "Done.", professional: "Completed." };
const HELP: Record<Tone, string> = {
  playful: "I move money so you don't have to — send, request, split, balances, who owes you. Just say it.",
  balanced: "I can send and request money, split bills, check balances, and track who owes you.",
  professional: "I can process payments and requests, split bills, report balances, and track receivables.",
};

export function AskZapster() {
  const { txs, session } = useApp();
  const { data: bal } = useBalance({ address: session?.address });
  const [tone, setTone] = useState<Tone>("playful");
  const [color, setColor] = useState(COLORS[0]);
  const [showCustomize, setShowCustomize] = useState(false);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<Msg[]>([{ who: "zap", text: GREET.playful }]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("litzap.aitone") as Tone | null;
      const c = localStorage.getItem("litzap.aicolor");
      if (t && GREET[t]) {
        setTone(t);
        setLog([{ who: "zap", text: GREET[t] }]);
      }
      if (c) setColor(c);
    } catch {}
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  function setToneP(t: Tone) {
    setTone(t);
    try { localStorage.setItem("litzap.aitone", t); } catch {}
  }
  function setColorP(c: string) {
    setColor(c);
    try { localStorage.setItem("litzap.aicolor", c); } catch {}
  }

  function answer(text: string): string {
    const t = text.toLowerCase();
    const amt = (t.match(/(\d+(?:\.\d+)?)/) || [])[1];
    const amount = amt ? parseFloat(amt) : undefined;
    const at = (text.match(/@[a-z0-9_]+/i) || [])[0];
    const noteM = text.match(/\bfor\s+(.+)$/i);
    const note = noteM ? noteM[1].trim() : undefined;
    const flair = FLAIR[tone];

    if (/what can you|help|who are you|capab/.test(t)) return HELP[tone];
    if (/balance|how much.*(have|left|got)/.test(t))
      return bal ? `You have ${(+bal.formatted).toFixed(3)} ${bal.symbol}.` : "Checking the chain — give me a sec.";
    if (/who.*owe|owes me|pending/.test(t)) {
      const r = txs.filter((x) => x.dir === "request" && x.status === "pending");
      return r.length ? `Waiting on ${r.map((x) => `${x.party} (${money(x.amount, x.token)})`).join(", ")}.` : "Nobody owes you anything.";
    }
    if (/spent|sent this|how much did i/.test(t)) {
      const out = txs.filter((x) => x.dir === "out" && x.token === "USDC").reduce((s, x) => s + x.amount, 0);
      return `You've moved ${money(out, "USDC")} so far.`;
    }
    if (/request|ask\b/.test(t)) return `Open the Request tab to ask someone${at ? ` like ${at}` : ""} — direct AI requests land when I'm wired to chain. ${flair}`.trim();
    if (/send|pay|transfer|split/.test(t)) return `Use the Send tab for a real on-chain send${at ? ` to ${at}` : ""} — talk-to-pay lands once I'm connected to chain. ${flair}`.trim();
    return "Ask me about your balance or who owes you — and use Send/Request to move money on-chain.";
  }

  function submit() {
    const msg = input.trim();
    if (!msg) return;
    const reply = answer(msg);
    setLog((l) => [...l, { who: "you", text: msg }, { who: "zap", text: reply }]);
    setInput("");
  }

  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <ZapsterFace size={30} />
        <span className="font-display text-sm font-bold" style={{ color }}>Zapster</span>
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em]" style={{ background: `${color}22`, color }}>
          your AI
        </span>
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

      <div ref={scroller} className="mb-3 max-h-48 space-y-2.5 overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {log.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${m.who === "you" ? "justify-end" : "justify-start"}`}>
              {m.who === "zap" && <ZapsterFace size={26} />}
              <span
                className="max-w-[82%] rounded-2xl px-3.5 py-2 text-sm"
                style={
                  m.who === "you"
                    ? { background: "var(--surface-2)", color: "var(--text)" }
                    : { background: `${color}1a`, color: "var(--text)", borderLeft: `3px solid ${color}` }
                }
              >
                {m.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 rounded-full px-4" style={{ background: "var(--field)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Tell Zapster what to do — e.g. send @maya 20" className="w-full bg-transparent py-3 text-sm outline-none" />
        <button onClick={submit} title="Send" style={{ color }}>
          <Icon name="arrowRight" size={18} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
