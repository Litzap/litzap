"use client";

import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";
import { Icon } from "./Icon";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative flex h-9 w-16 items-center rounded-full border px-1"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-white"
        style={{
          marginLeft: dark ? "auto" : 0,
          background: "linear-gradient(180deg, var(--accent), var(--accent-2))",
        }}
      >
        <Icon name={dark ? "moon" : "sun"} size={15} strokeWidth={2} />
      </motion.span>
    </button>
  );
}
