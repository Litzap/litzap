"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { label: "People", href: "/people" },
  { label: "Business", href: "/business" },
  { label: "Developers", href: "/developers" },
  { label: "Projects", href: "/projects" },
];

export function MarketingHeader({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{ background: "color-mix(in srgb, var(--bg) 68%, transparent)", backdropFilter: "blur(14px)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" aria-label="LitZap home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="transition hover:text-text">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {onGetStarted ? (
            <button onClick={onGetStarted} className="btn-primary px-5 py-2 text-sm">
              Get started
            </button>
          ) : (
            <Link href="/#start" className="btn-primary px-5 py-2 text-sm">
              Get started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4 md:px-10">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">The open money layer — built on LitVM.</p>
        </div>
        <FooterCol title="Product" links={[["People", "/people"], ["Business", "/business"], ["Developers", "/developers"], ["Projects", "/projects"]]} />
        <FooterCol title="Get started" links={[["Create account", "/#start"], ["Get paid", "/#start"], ["Partner with us", "/projects"]]} />
        <FooterCol title="Trust" links={[["Security", "/security"], ["Non-custodial", "/security"], ["Contracts", "/security"]]} />
      </div>
      <div className="border-t py-6 text-center text-xs text-muted" style={{ borderColor: "var(--border)" }}>
        © 2026 LitZap · Built on LitVM · Non-custodial
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-text">{title}</h4>
      <ul className="space-y-2">
        {links.map(([l, h]) => (
          <li key={l}>
            <Link href={h} className="text-sm text-muted transition hover:text-accent">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
