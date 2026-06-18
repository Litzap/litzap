"use client";

/* eslint-disable @next/next/no-img-element */

/** Real fox-bolt mark (transparent SVG asset). */
export function LogoMark({ size = 30 }: { size?: number }) {
  return <img src="/zapster_raw/logo.svg" width={size} height={size} alt="" className="shrink-0" />;
}

export function Logo({ markSize = 30 }: { markSize?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={markSize} />
      <span className="font-brand text-xl font-semibold tracking-tight text-text">LitZap</span>
    </span>
  );
}
