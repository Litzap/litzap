"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useApp, type View } from "@/lib/store";
import { useEmbeddedWallet } from "@/lib/wallet";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Home } from "./Home";
import { SendView } from "./SendView";
import { RequestView } from "./RequestView";
import { ReceiveView } from "./ReceiveView";
import { ActivityView } from "./ActivityView";
import { DropsView } from "./DropsView";
import { NoticeModal } from "./NoticeModal";

const NAV: { id: View; icon: IconName; label: string }[] = [
  { id: "home", icon: "home", label: "Home" },
  { id: "send", icon: "send", label: "Send" },
  { id: "request", icon: "arrowDownLeft", label: "Request" },
  { id: "drops", icon: "bolt", label: "Drops" },
  { id: "receive", icon: "qr", label: "Receive" },
  { id: "activity", icon: "activity", label: "Activity" },
];

const VIEWS = { home: Home, send: SendView, request: RequestView, receive: ReceiveView, drops: DropsView, activity: ActivityView };

export function Shell() {
  const { view, setView, session, signOut } = useApp();
  const { logout } = usePrivy();
  const address = useEmbeddedWallet();

  // sponsor gas: top up the wallet so email users can send without holding gas
  useEffect(() => {
    if (!address) return;
    fetch("/api/gas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    }).catch(() => {});
  }, [address]);

  if (!session) return null;
  const Current = VIEWS[view];

  const handleSignOut = () => {
    logout().catch(() => {});
    signOut();
  };

  return (
    <div className="md:grid md:grid-cols-[248px_1fr]">
      <NoticeModal />
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between p-4 md:flex">
        <div>
          <div className="px-1.5">
            <Logo />
          </div>
          <nav className="mt-10 space-y-1">
            {NAV.map((n) => {
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition"
                  style={{
                    background: active ? "var(--accent-ring)" : "transparent",
                    color: active ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  <Icon name={n.icon} size={18} />
                  {n.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: "var(--surface-2)" }}>
            <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
              {session.username[0]?.toUpperCase()}
            </span>
            <span className="truncate text-sm font-semibold text-text">{session.username}.zap</span>
            <button onClick={handleSignOut} className="ml-auto text-muted hover:text-text" title="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* main */}
      <div className="min-h-screen pb-24 md:pb-0">
        {/* mobile header */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden"
          style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", backdropFilter: "blur(10px)" }}
        >
          <Logo markSize={28} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleSignOut} className="text-muted" title="Sign out">
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-5 py-8 md:px-10 md:py-10">
          <Current />
        </main>

        {/* mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around px-2 py-2 md:hidden"
          style={{ background: "color-mix(in srgb, var(--bg) 90%, transparent)", backdropFilter: "blur(10px)" }}
        >
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className="flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-semibold"
              style={{ color: view === n.id ? "var(--accent)" : "var(--muted)" }}
            >
              <Icon name={n.icon} size={20} />
              {n.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
