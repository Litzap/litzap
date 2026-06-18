"use client";

import { Icon, type IconName } from "./Icon";

const TECH: { icon: IconName; label: string }[] = [
  { icon: "globe", label: "Omnichain" },
  { icon: "bolt", label: "Instant · <0.1 Gwei" },
  { icon: "shield", label: "MWEB-ready privacy" },
  { icon: "key", label: "Non-custodial" },
];

export function TechStrip() {
  return (
    <div className="flex flex-wrap gap-2">
      {TECH.map((t) => (
        <span
          key={t.label}
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-muted"
          style={{ background: "var(--surface-2)", backdropFilter: "blur(8px)" }}
        >
          <Icon name={t.icon} size={14} />
          <span className="text-text">{t.label}</span>
        </span>
      ))}
    </div>
  );
}
