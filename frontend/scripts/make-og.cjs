// Generates the LitZap social share card (1200x630) used for Open Graph + Twitter.
// Output: app/opengraph-image.png and app/twitter-image.png (Next auto-wires meta tags).
const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const pub = path.join(__dirname, "..", "public", "zapster_raw");
const fonts = path.join(__dirname, "..", ".bannerfonts");
const appDir = path.join(__dirname, "..", "app");

const mascotBuf = fs.readFileSync(path.join(pub, "zapster_idle.png"));
const mascot64 = mascotBuf.toString("base64");
const dim = pngSize(mascotBuf);
const mAR = dim.w / dim.h;

function pngSize(buf) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const W = 1200, H = 630;
// mascot anchored to the right, vertically centered
const mH = 560, mW = mH * mAR;
const mX = W - mW - 8, mY = (H - mH) / 2 + 6;

const logoMark = `
  <g transform="translate(82,92) scale(0.20)">
    <path fill="url(#mark)" fill-rule="evenodd" d="
      M156 92 L210 180 L256 132 L302 180 L356 92 L374 204
      C374 204 398 246 398 296 C398 362 332 426 256 448
      C180 426 114 362 114 296 C114 246 138 204 138 204 Z
      M272 168 L210 286 L250 286 L238 374 L306 252 L264 252 L290 168 Z"/>
  </g>`;

let dots = "";
const rng = mulberry(20260626);
for (let i = 0; i < 54; i++) {
  const x = 560 + rng() * 620, y = 30 + rng() * 560;
  const r = 1 + rng() * 2.4, o = 0.05 + rng() * 0.13;
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

  <g>
    <rect x="-200" y="150" width="1700" height="100" fill="url(#streak)" transform="rotate(-14 600 315)"/>
    <rect x="-200" y="380" width="1700" height="70" fill="url(#streak)" transform="rotate(-14 600 315)"/>
  </g>

  ${dots}

  <ellipse cx="${(mX + mW / 2).toFixed(0)}" cy="330" rx="360" ry="320" fill="url(#glow)"/>

  <image href="data:image/png;base64,${mascot64}" x="${mX.toFixed(0)}" y="${mY.toFixed(0)}" width="${mW.toFixed(0)}" height="${mH}" preserveAspectRatio="xMidYMid meet"/>

  ${logoMark}

  <text x="172" y="148" font-family="Plus Jakarta Sans" font-weight="600" font-size="20" letter-spacing="4.5" fill="#7e8aa6">OPEN MONEY FOR THE WORLD · BUILT ON LITVM</text>

  <text x="166" y="300" font-family="Fraunces" font-weight="600" font-size="150" fill="#ffffff" letter-spacing="-1">Lit<tspan fill="url(#zap)">Zap</tspan></text>

  <text x="172" y="376" font-family="Fraunces" font-style="italic" font-weight="500" font-size="56" fill="#cdd6ea">Money, everywhere.</text>

  <text x="174" y="470" font-family="Plus Jakarta Sans" font-weight="500" font-size="26" fill="#9aa6c2">Send to anyone, anywhere — even by their @.</text>
  <text x="174" y="510" font-family="Plus Jakarta Sans" font-weight="500" font-size="26" fill="#9aa6c2">Non-custodial · gas-free · no seed phrase.</text>

  <text x="174" y="582" font-family="Plus Jakarta Sans" font-weight="700" font-size="27" fill="#5B86FF">litzap.xyz</text>
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
fs.writeFileSync(path.join(appDir, "opengraph-image.png"), png);
fs.writeFileSync(path.join(appDir, "twitter-image.png"), png);
console.log("wrote app/opengraph-image.png + app/twitter-image.png", png.length, "bytes");
