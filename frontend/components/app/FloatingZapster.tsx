"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZapsterFace } from "@/components/Zapster";
import { Icon } from "@/components/Icon";
import { AskZapster } from "./AskZapster";

export function FloatingZapster() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* launcher — above the mobile bottom nav, bottom-right on desktop.
          Labelled so it's clearly the AI assistant, not a stray icon. */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Zapster" : "Ask Zapster"}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full pl-2 pr-1 md:bottom-6 md:right-6"
        style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "var(--shadow)" }}
      >
        {!open && <span className="py-1 pl-2 text-sm font-bold text-white">Ask Zapster</span>}
        <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: open ? "rgba(255,255,255,0.18)" : "transparent" }}>
          {open ? <Icon name="check" size={22} className="text-white" /> : <ZapsterFace size={40} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed bottom-40 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm md:bottom-24 md:right-6"
            >
              <AskZapster />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
