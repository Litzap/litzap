// Generates the LitZap X banner (1500x500) from brand assets.
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const pub = path.join(__dirname, "..", "public", "zapster_raw");
const fonts = path.join(__dirname, "..", ".bannerfonts");
const out = path.join(__dirname, "..", "public", "brand");
fs.mkdirSync(out, areOpts());
function areOpts() { return { recursive: true }; }

const mascotBuf = fs.readFileSync(path.join(pub, "zapster_idle.png"));
const mascot64 = mascotBuf.toString("base64");
// natural size of the mascot for aspect ratio
const dim = pngSize(mascotBuf);
const mAR = dim.w / dim.h;

function pngSize(buf) {
  // IHDR at offset 16 (width), 20 (height)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const W = 1500, H = 500;
// place mascot on the right, vertically centered, larger to fill the right third
const mH = 472, mW = mH * mAR;
const mX = 1428 - mW, mY = (H - mH) / 2 + 8;

const logoMark = `
  <g transform="translate(92,158) scale(0.158)">
    <path fill="url(#mark)" fill-rule="evenodd" d="
      M156 92 L210 180 L256 132 L302 180 L356 92 L374 204
      C374 204 398 246 398 296 C398 362 332 426 256 448
      C180 426 114 362 114 296 C114 246 138 204 138 204 Z
      M272 168 L210 286 L250 286 L238 374 L306 252 L264 252 L290 168 Z"/>
  </g>`;

// faint network dots scattered on the right side
let dots = "";
const rng = mulberry(20260618);
for (let i = 0; i < 46; i++) {
  const x = 760 + rng() * 720, y = 40 + rng() * 420;
  const r = 1 + rng() * 2.2, o = 0.05 + rng() * 0.12;
  dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#8fb0ff" opacity="${o.toFixed(2)}"/>`;
}
function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0f1e"/>
      <stop offset="0.55" stop-color="#080a14"/>
      <stop offset="1" stop-color="#05060c"/>
    </linearGradient>
    <linearGradient id="mark" x1="120" y1="80" x2="392" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B6EF6"/><stop offset="0.55" stop-color="#5B86FF"/><stop offset="1" stop-color="#7B5BFF"/>
    </linearGradient>
    <linearGradient id="zap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6f9bff"/><stop offset="0.6" stop-color="#5B86FF"/><stop offset="1" stop-color="#8a6bff"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#3f6dff" stop-opacity="0.55"/>
      <stop offset="0.45" stop-color="#5b48d6" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#5b48d6" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="streak" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#5B86FF" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#7aa0ff" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#5B86FF" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- aurora streaks -->
  <g>
    <rect x="-200" y="120" width="2000" height="90" fill="url(#streak)" transform="rotate(-14 750 250)"/>
    <rect x="-200" y="300" width="2000" height="60" fill="url(#streak)" transform="rotate(-14 750 250)"/>
  </g>

  ${dots}

  <!-- glow behind mascot -->
  <ellipse cx="${(mX + mW / 2).toFixed(0)}" cy="262" rx="380" ry="310" fill="url(#glow)"/>

  <!-- mascot -->
  <image href="data:image/png;base64,${mascot64}" x="${mX.toFixed(0)}" y="${mY.toFixed(0)}" width="${mW.toFixed(0)}" height="${mH}" preserveAspectRatio="xMidYMid meet"/>

  ${logoMark}

  <!-- eyebrow (kept above the avatar zone) -->
  <text x="180" y="150" font-family="Plus Jakarta Sans" font-weight="600" font-size="17" letter-spacing="4.5" fill="#7e8aa6">OPEN MONEY FOR THE WORLD · BUILT ON LITVM</text>

  <!-- wordmark -->
  <text x="178" y="262" font-family="Fraunces" font-weight="600" font-size="118" fill="#ffffff" letter-spacing="-1">Lit<tspan fill="url(#zap)">Zap</tspan></text>

  <!-- tagline -->
  <text x="182" y="328" font-family="Fraunces" font-style="italic" font-weight="500" font-size="46" fill="#cdd6ea">Money, everywhere.</text>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  background: "rgba(0,0,0,0)",
  font: {
    fontFiles: [
      path.join(fonts, "Fraunces.ttf"),
      path.join(fonts, "Fraunces-Italic.ttf"),
      path.join(fonts, "Jakarta.ttf"),
    ],
    loadSystemFonts: false,
    defaultFontFamily: "Fraunces",
  },
});
const png = resvg.render().asPng();
const dest = path.join(out, "x-banner.png");
fs.writeFileSync(dest, png);
console.log("wrote", dest, png.length, "bytes", "mascot", dim.w + "x" + dim.h);
