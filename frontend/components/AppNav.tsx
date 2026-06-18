"use client";

import { ConnectButton } from "./ConnectButton";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { Icon, type IconName } from "./Icon";

const NAV: { icon: IconName; label: string; href: string }[] = [
  { icon: "send", label: "Send", href: "#send" },
  { icon: "activity", label: "Activity", href: "#activity" },
  { icon: "capsules", label: "Capsules", href: "#capsules" },
  { icon: "globe", label: "Receive", href: "#send" },
];

/* Desktop: persistent left rail */
export function Sidebar() {
  return (
    <aside
      className="sticky top-0 hidden h-screen flex-col justify-between border-r px-4 py-6 md:flex"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <div className="px-1.5">
          <Logo />
        </div>
        <nav className="mt-10 space-y-1">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-[var(--surface-2)] hover:text-text"
            >
              <Icon name={n.icon} size={18} />
              {n.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="space-y-3 px-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Appearance</span>
          <ThemeToggle />
        </div>
        <div className="grid">
          <ConnectButton />
        </div>
      </div>
    </aside>
  );
}

/* Mobile: top bar */
export function MobileHeader() {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 md:hidden"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--bg) 82%, transparent)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Logo />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <ConnectButton />
      </div>
    </header>
  );
}

/* Mobile: bottom tab bar */
export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t px-2 py-2 md:hidden"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        backdropFilter: "blur(10px)",
      }}
    >
      {NAV.map((n) => (
        <a
          key={n.label}
          href={n.href}
          className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold text-muted"
        >
          <Icon name={n.icon} size={20} />
          {n.label}
        </a>
      ))}
    </nav>
  );
}
