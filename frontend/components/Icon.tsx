"use client";

import type { ReactNode } from "react";

export type IconName =
  | "send"
  | "activity"
  | "capsules"
  | "globe"
  | "shield"
  | "clock"
  | "bolt"
  | "key"
  | "copy"
  | "sun"
  | "moon"
  | "lock"
  | "check"
  | "mail"
  | "wallet"
  | "passkey"
  | "at"
  | "arrowRight"
  | "arrowDownLeft"
  | "qr"
  | "plus"
  | "x"
  | "discord"
  | "home"
  | "logout"
  | "scan";

const paths: Record<IconName, ReactNode> = {
  send: <path d="M7 17 17 7M9 7h8v8" />,
  activity: <path d="M3 12h4l2.5-7 4 14 2.5-7H22" />,
  capsules: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
    </>
  ),
  shield: <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  bolt: <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" />,
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M17 6l2.2 2.2M14 9l2.2 2.2" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2.2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M5 12.5 10 17l9-10" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  wallet: (
    <>
      <path d="M3 8a2 2 0 0 1 2-2h11v4" />
      <rect x="3" y="8" width="18" height="12" rx="2.5" />
      <circle cx="17" cy="14" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  passkey: (
    <>
      <circle cx="10" cy="9" r="4" />
      <path d="M3 20c0-3.3 3.1-6 7-6 1.1 0 2.1.2 3 .6" />
      <circle cx="17.5" cy="16.5" r="3.5" />
      <path d="M17.5 18.5v3l1.2-1 1.2 1v-3" />
    </>
  ),
  at: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.4 7.1" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowDownLeft: <path d="M17 7 7 17M7 9v8h8" />,
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M5 5l14 14M19 5 5 19" />,
  discord: (
    <>
      <path d="M8 7c2.7-1 5.3-1 8 0l1 2c1 2.4 1 5 0 8-1 .8-2.2 1.4-3.5 1.7L12 17l-1.5 1.7C9.2 18.4 8 17.8 7 17c-1-3-1-5.6 0-8l1-2z" />
      <circle cx="9.8" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.2" cy="12.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7M6 10v9h12v-9" />,
  logout: <path d="M15 12H4M9 7l-5 5 5 5M14 4h5v16h-5" />,
  scan: <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" />,
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

/** Square gradient brand mark. */
export function Brandmark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(160deg, var(--accent), var(--accent-2))",
        boxShadow: "0 4px 14px var(--accent-ring)",
      }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" />
      </svg>
    </span>
  );
}
