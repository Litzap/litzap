// Horizontal LitZap logo lockup (mark + wordmark), light & dark variants.
const fs = require("fs"), path = require("path");
const { Resvg } = require("@resvg/resvg-js");
const fonts = path.join(__dirname, "..", ".bannerfonts");
const out = path.join(__dirname, "..", "public", "brand");

function lockup(textColor) {
  return `<svg width="980" height="320" viewBox="0 0 980 320" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mark" x1="120" y1="80" x2="392" y2="440" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B6EF6"/><stop offset="0.55" stop-color="#5B86FF"/><stop offset="1" stop-color="#7B5BFF"/></linearGradient>
    <linearGradient id="zap" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6f9bff"/><stop offset="0.6" stop-color="#5B86FF"/><stop offset="1" stop-color="#8a6bff"/></linearGradient>
  </defs>
  <g transform="translate(14,44) scale(0.45)">
    <path fill="url(#mark)" fill-rule="evenodd" d="M156 92 L210 180 L256 132 L302 180 L356 92 L374 204 C374 204 398 246 398 296 C398 362 332 426 256 448 C180 426 114 362 114 296 C114 246 138 204 138 204 Z M272 168 L210 286 L250 286 L238 374 L306 252 L264 252 L290 168 Z"/>
  </g>
  <text x="262" y="218" font-family="Fraunces" font-weight="600" font-size="170" letter-spacing="-2" fill="${textColor}">Lit<tspan fill="url(#zap)">Zap</tspan></text>
</svg>`;
}

const font = {
  fontFiles: [path.join(fonts, "Fraunces.ttf")],
  loadSystemFonts: false,
  defaultFontFamily: "Fraunces",
};

for (const [name, color] of [["logo-lockup-dark", "#0e1326"], ["logo-lockup-light", "#ffffff"]]) {
  const r = new Resvg(lockup(color), { fitTo: { mode: "width", value: 980 }, font });
  fs.writeFileSync(path.join(out, name + ".png"), r.render().asPng());
  console.log("wrote", name + ".png");
}
