"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useApp } from "@/lib/store";
import { Icon, type IconName } from "@/components/Icon";

type Row = {
  key: "x" | "discord";
  label: string;
  icon: IconName;
  handle?: string;
  link: () => void;
  unlink: () => void;
};

export function ConnectSocials() {
  const { user, linkTwitter, linkDiscord, unlinkTwitter, unlinkDiscord } = usePrivy();
  const { session, setSocials } = useApp();

  const x = user?.twitter?.username ?? undefined;
  const discord = user?.discord?.username ?? undefined;

  // mirror Privy's verified handles into the app session
  useEffect(() => {
    if (!session) return;
    if ((x ?? "") !== (session.socials.x ?? "") || (discord ?? "") !== (session.socials.discord ?? "")) {
      setSocials({ x, discord });
    }
  }, [x, discord, session, setSocials]);

  if (!session) return null;

  const rows: Row[] = [
    {
      key: "x",
      label: "X",
      icon: "x",
      handle: x,
      link: () => linkTwitter(),
      unlink: () => user?.twitter?.subject && unlinkTwitter(user.twitter.subject),
    },
    {
      key: "discord",
      label: "Discord",
      icon: "discord",
      handle: discord,
      link: () => linkDiscord(),
      unlink: () => user?.discord?.subject && unlinkDiscord(user.discord.subject),
    },
  ];

  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.16em] text-muted">Verified handles</h2>
      <p className="mb-3 mt-1 text-xs text-muted">Link your socials so people can pay you by handle — verified through your own account, no password shared.</p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-3 rounded-full px-5 py-3" style={{ background: "var(--field)" }}>
            <Icon name={r.icon} size={18} />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted">{r.label}</div>
              <div className="truncate text-sm font-semibold text-text">
                {r.handle ? `@${r.handle}` : "Not connected"}
              </div>
            </div>
            {r.handle ? (
              <span className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                  <Icon name="check" size={14} /> Verified
                </span>
                <button onClick={r.unlink} className="text-xs text-muted underline">Remove</button>
              </span>
            ) : (
              <button onClick={r.link} className="btn-primary ml-auto px-4 py-2 text-xs">Connect</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
