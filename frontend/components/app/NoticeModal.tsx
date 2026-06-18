"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/store";
import { Zapster } from "@/components/Zapster";
import { money } from "./ui";

export function NoticeModal() {
  const { incoming, claimIncoming } = useApp();
  const [dismissed, setDismissed] = useState(false);

  // re-open whenever a new batch of incoming appears
  useEffect(() => {
    if (incoming.length > 0) setDismissed(false);
  }, [incoming.length]);

  const open = incoming.length > 0 && !dismissed;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-5"
          style={{ background: "color-mix(in srgb, var(--bg) 68%, transparent)", backdropFilter: "blur(10px)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="panel w-full max-w-sm p-7 text-center"
          >
            <div className="flex justify-center">
              <Zapster mood="success" size={150} />
            </div>
            <h2 className="font-brand mt-2 text-2xl font-semibold text-text">You've got money waiting</h2>
            <p className="mt-1 text-sm text-muted">
              {incoming.length} payment{incoming.length > 1 ? "s" : ""} sent to your socials.
            </p>

            <div className="mt-4 space-y-2">
              {incoming.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-full px-4 py-2.5" style={{ background: "var(--field)" }}>
                  <span className="truncate text-sm text-text">from {c.from}.zap{c.note ? ` · ${c.note}` : ""}</span>
                  <button onClick={() => claimIncoming(c.id)} className="btn-primary ml-2 shrink-0 px-4 py-1.5 text-xs">
                    Claim {money(c.amount, c.token)}
                  </button>
                </div>
              ))}
            </div>

            <button onClick={() => setDismissed(true)} className="mt-4 text-xs text-muted hover:text-text">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
