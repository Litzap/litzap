import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { join } from "path";

// Dynamic 1200x630 social-card renderer for per-link previews (pay-links and
// drops). Uses resvg (the same pipeline as the static app card) so it renders
// the real brand fonts reliably. Returns a PNG Response — used directly by the
// opengraph-image / twitter-image route conventions.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const W = 1200;
const H = 630;

// Files live under frontend/assets/og — bundled into the function via
// outputFileTracingIncludes in next.config.mjs so they exist at runtime.
function assetPath(file: string) {
  return join(process.cwd(), "assets", "og", file);
}

type Cache = { fontFiles: string[]; send: string; success: string };
let cached: Cache | null = null;

function assets(): Cache {
  if (cached) return cached;
  const fontFiles = [assetPath("Fraunces.ttf"), assetPath("Jakarta.ttf")];
  const b64 = (f: string) => readFileSync(assetPath(f)).toString("base64");
  cached = { fontFiles, send: b64("zapster_send.png"), success: b64("zapster_success.png") };
  return cached;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// PNG IHDR: width @16, height @20 — for mascot aspect ratio.
function pngAspect(b64: string) {
  const buf = Buffer.from(b64, "base64");
  return buf.readUInt32BE(16) / buf.readUInt32BE(20);
}

function buildSvg(p: {
  eyebrow: string;
  title: string;
  accent: string;
  subtitle: string;
  mascot64: string;
}) {
  const mAR = pngAspect(p.mascot64);
  const mH = 560;
  const mW = mH * mAR;
  const mX = W - mW - 8;
  const mY = (H - mH) / 2 + 6;

  // wrap subtitle to ~2 lines around 42 chars
  const words = p.subtitle.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 42) {
      lines.push(cur.trim());
      cur = w;
    } else cur += " " + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  const subtitleTspans = lines
    .slice(0, 2)
    .map((l, i) => `<tspan x="174" dy="${i === 0 ? 0 : 40}">${esc(l)}</tspan>`)
    .join("");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0f1e"/><stop offset="0.55" stop-color="#080a14"/><stop offset="1" stop-color="#05060c"/>
    </linearGradient>
    <linearGradient id="zap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6f9bff"/><stop offset="0.6" stop-color="#5B86FF"/><stop offset="1" stop-color="#8a6bff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#3f6dff" stop-opacity="0.5"/><stop offset="0.45" stop-color="#5b48d6" stop-opacity="0.16"/><stop offset="1" stop-color="#5b48d6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${(mX + mW / 2).toFixed(0)}" cy="330" rx="360" ry="320" fill="url(#glow)"/>
  <image href="data:image/png;base64,${p.mascot64}" x="${mX.toFixed(0)}" y="${mY.toFixed(0)}" width="${mW.toFixed(0)}" height="${mH}" preserveAspectRatio="xMidYMid meet"/>
  <text x="72" y="92" font-family="Fraunces" font-weight="700" font-size="36" letter-spacing="-1" fill="#ffffff">Lit<tspan fill="url(#zap)">Zap</tspan></text>
  <text x="174" y="210" font-family="Plus Jakarta Sans" font-weight="600" font-size="22" letter-spacing="4" fill="#7e8aa6">${esc(p.eyebrow)}</text>
  <text x="170" y="320" font-family="Fraunces" font-weight="600" font-size="86" fill="#ffffff">${esc(p.title)} <tspan fill="url(#zap)">${esc(p.accent)}</tspan></text>
  <text y="392" font-family="Plus Jakarta Sans" font-weight="500" font-size="29" fill="#9aa6c2">${subtitleTspans}</text>
  <text x="174" y="540" font-family="Plus Jakarta Sans" font-weight="700" font-size="26" fill="#5B86FF">litzap.xyz</text>
</svg>`;
}

function toPng(svg: string) {
  const a = assets();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
    background: "rgba(0,0,0,0)",
    font: { fontFiles: a.fontFiles, loadSystemFonts: false, defaultFontFamily: "Fraunces" },
  });
  return resvg.render().asPng();
}

function pngResponse(png: Buffer) {
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, immutable, no-transform, max-age=86400",
    },
  });
}

function cleanHandle(raw: string) {
  const h = decodeURIComponent(raw || "")
    .replace(/^@/, "")
    .replace(/\.zap$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
  return h || "someone";
}

export function renderUserOg(handle: string) {
  const h = cleanHandle(handle);
  const { send } = assets();
  return pngResponse(
    toPng(
      buildSvg({
        eyebrow: "PAY ON LITZAP",
        title: "Pay",
        accent: `@${h}`,
        subtitle: `Send money to ${h}.zap — instant, non-custodial, gas-free.`,
        mascot64: send,
      }),
    ),
  );
}

export function renderDropOg() {
  const { success } = assets();
  return pngResponse(
    toPng(
      buildSvg({
        eyebrow: "A LITZAP DROP",
        title: "You've got",
        accent: "a Drop.",
        subtitle: "Claim your money on LitZap — no account or seed phrase needed.",
        mascot64: success,
      }),
    ),
  );
}
