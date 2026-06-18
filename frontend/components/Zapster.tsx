"use client";

/* eslint-disable @next/next/no-img-element */
import { motion, AnimatePresence } from "framer-motion";

export type Mood = "idle" | "zap" | "ghost" | "success" | "broke";

const SRC: Record<Mood, string> = {
  idle: "/zapster_raw/zapster_idle.png",
  zap: "/zapster_raw/zapster_send.png",
  success: "/zapster_raw/zapster_success.png",
  ghost: "/zapster_raw/zapster_ghost.png",
  broke: "/zapster_raw/zapster_idle.png",
};

/** Small circular mascot face for chat/avatars. */
export function ZapsterFace({ size = 36 }: { size?: number }) {
  return (
    <img
      src="/zapster_raw/zapster_face.png"
      alt="Zapster"
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ background: "linear-gradient(160deg, var(--accent-ring), transparent)" }}
    />
  );
}

export function Zapster({ mood = "idle", size = 240 }: { mood?: Mood; size?: number }) {
  const ghost = mood === "ghost";
  const zap = mood === "zap";

  return (
    <div className="relative" style={{ width: size, height: size * 1.28 }}>
      {/* glow */}
      <div
        className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 blur-3xl"
        style={{ width: size, height: size, background: "radial-gradient(closest-side, var(--accent-ring), transparent)" }}
      />

      {/* ambient sparks */}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: 7,
            height: 7,
            background: "var(--accent)",
            boxShadow: "0 0 12px var(--accent)",
            top: ["6%", "58%", "26%"][i],
            left: ["84%", "4%", "92%"][i],
          }}
          animate={{ y: [0, -12, 0], opacity: [0.2, 1, 0.2], scale: [0.6, 1.1, 0.6] }}
          transition={{ duration: 2.4 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}

      {/* speed lines on send */}
      <AnimatePresence>
        {zap &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={`s${i}`}
              className="absolute h-[3px] rounded-full"
              style={{ background: "var(--accent)", top: `${28 + i * 12}%`, left: "-6%", width: 44 }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: [0, 1, 0], x: [30, -26] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}
      </AnimatePresence>

      {/* mascot */}
      <motion.div
        className="h-full w-full"
        animate={zap ? { x: [0, 30, 0], rotate: [0, -6, 0], y: [0, -14, 0] } : { y: [0, -8, 0] }}
        transition={zap ? { duration: 0.55 } : { duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={mood}
            src={SRC[mood]}
            alt="Zapster"
            className="h-full w-full object-contain"
            style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.32))", opacity: ghost ? 0.9 : 1 }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: ghost ? 0.9 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          />
        </AnimatePresence>
      </motion.div>

      {/* bolt on send */}
      <AnimatePresence>
        {zap && (
          <motion.svg
            key="bolt"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="#5b86ff"
            className="absolute right-0 top-3"
            initial={{ opacity: 0, scale: 0.4, x: 10 }}
            animate={{ opacity: 1, scale: 1.3, x: 56, y: -22 }}
            exit={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 0.6 }}
          >
            <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
