"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zapster, type Mood } from "@/components/Zapster";
import { Avatar } from "@/components/People";
import { Icon } from "@/components/Icon";

const CHIPS = ["send @amara 20 for lunch", "pay @kenji 15 privately", "split 60 with friends"];

function seedOf(name: string) {
  let s = 0;
  for (const c of name) s += c.charCodeAt(0);
  return s;
}

function parse(cmd: string) {
  const amt = (cmd.match(/(\d+(?:\.\d+)?)/) || [])[1];
  const at = (cmd.match(/@[a-z0-9_]+/i) || [])[0] || "@amara";
  const priv = /privat|ghost|secret|hidden/i.test(cmd);
  const noteM = cmd.match(/\bfor\s+(.+)$/i);
  return { amount: amt ? parseFloat(amt) : 20, to: at, priv, note: noteM ? noteM[1].trim() : undefined };
}

export function TalkToPay({ onStart }: { onStart: () => void }) {
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"idle" | "flying" | "done">("idle");
  const [mood, setMood] = useState<Mood>("idle");
  const [p, setP] = useState(parse("send @amara 20 for lunch"));

  function run(cmd: string) {
    if (!cmd.trim()) return;
    const parsed = parse(cmd);
    setP(parsed);
    setInput("");
    setStep("flying");
    setMood(parsed.priv ? "ghost" : "zap");
    window.setTimeout(() => setStep("done"), 1500);
    window.setTimeout(() => setMood("idle"), 2800);
  }

  return (
    <div className="w-full">
      {/* command bar */}
      <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <Icon name="bolt" size={15} strokeWidth={2.4} />
        </span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(input)}
          placeholder="Tell Zapster who to pay…"
          className="w-full bg-transparent py-2.5 text-sm outline-none"
        />
        <button onClick={() => run(input)} className="btn-primary shrink-0 px-5 py-2 text-sm">
          Pay
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => run(c)}
            className="rounded-full px-3 py-1.5 text-xs text-muted transition hover:text-accent"
            style={{ background: "var(--surface-2)" }}
          >
            “{c}”
          </button>
        ))}
      </div>

      {/* stage */}
      <div className="relative mt-5 h-[300px] w-full overflow-hidden rounded-[28px]" style={{ background: "var(--surface)", boxShadow: "var(--shadow)" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M16 78 Q52 8 84 24" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="0.6" strokeDasharray="1.5 2" fill="none" />
        </svg>

        {/* You */}
        <div className="absolute bottom-1 left-[3%] flex flex-col items-center">
          <Zapster mood={mood} size={118} />
        </div>

        {/* Recipient */}
        <div className="absolute right-[7%] top-[8%] flex flex-col items-center gap-1">
          <div className="relative">
            <Avatar seed={seedOf(p.to)} size={58} />
            <AnimatePresence>
              {step === "done" && (
                <motion.span
                  key="amt"
                  initial={{ opacity: 0, y: 8, scale: 0.7 }}
                  animate={{ opacity: 1, y: -6, scale: 1 }}
                  className="absolute -right-3 -top-4 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}
                >
                  +Ƚ{p.amount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <span className="text-xs font-semibold text-text">{p.to}</span>
          {step === "done" && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--positive)" }}>
              <Icon name="check" size={11} strokeWidth={3} /> received
            </span>
          )}
        </div>

        {/* flying coin */}
        <AnimatePresence>
          {step === "flying" && (
            <motion.div
              key="coin"
              className="absolute z-10 grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold text-white"
              style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "0 0 20px var(--accent)" }}
              initial={{ left: "14%", top: "72%", opacity: 0, scale: 0.5 }}
              animate={{ left: ["14%", "50%", "80%"], top: ["72%", "10%", "20%"], opacity: [0, 1, 1], scale: [0.5, 1.1, 0.9] }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            >
              {p.priv ? <Icon name="shield" size={16} /> : "Ƚ"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* result banner */}
        <AnimatePresence>
          {step === "done" && (
            <motion.div
              key="banner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl px-4 py-2.5"
              style={{ background: "color-mix(in srgb, var(--bg) 70%, transparent)", backdropFilter: "blur(10px)" }}
            >
              <span className="text-sm text-text">
                Sent <b>Ƚ{p.amount}</b> to {p.to}
                {p.priv ? " — privately 👻" : " — instant ⚡"}
                {p.note ? ` for ${p.note}` : ""}.
              </span>
              <button onClick={onStart} className="btn-primary ml-auto shrink-0 px-4 py-2 text-xs">
                Do it for real
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
