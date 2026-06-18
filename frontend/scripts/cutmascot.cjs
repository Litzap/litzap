const Jimp = require("jimp");
const DIR = "public/zapster_raw";

function flood(image) {
  const b = image.bitmap, d = b.data, w = b.width, h = b.height;
  const white = (i) => d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 232;
  const vis = new Uint8Array(w * h);
  const st = [];
  for (let x = 0; x < w; x++) { st.push(x); st.push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { st.push(y * w); st.push(y * w + (w - 1)); }
  while (st.length) {
    const p = st.pop();
    if (vis[p]) continue;
    vis[p] = 1;
    const i = p * 4;
    if (!white(i)) continue;
    d[i + 3] = 0;
    const x = p % w, y = (p - x) / w;
    if (x + 1 < w) st.push(p + 1);
    if (x - 1 >= 0) st.push(p - 1);
    if (y + 1 < h) st.push(p + w);
    if (y - 1 >= 0) st.push(p - w);
  }
}

function bbox(image) {
  const b = image.bitmap, d = b.data, w = b.width, h = b.height;
  let minX = w, minY = h, maxX = 0, maxY = 0, found = false;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 16) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  if (!found) return image;
  const pad = 12;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  return image.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);
}

(async () => {
  const img = await Jimp.read(`${DIR}/zapster_sheet_white.png`);
  const W = img.bitmap.width, H = img.bitmap.height;
  const hw = Math.floor(W / 2), hh = Math.floor(H / 2);
  const quads = [
    { n: "zapster_idle", x: 0, y: 0, w: hw, h: hh },
    { n: "zapster_send", x: hw, y: 0, w: W - hw, h: hh },
    { n: "zapster_ghost", x: 0, y: hh, w: hw, h: H - hh },
    { n: "zapster_success", x: hw, y: hh, w: W - hw, h: H - hh },
  ];
  for (const q of quads) {
    const c = img.clone().crop(q.x, q.y, q.w, q.h);
    flood(c);
    const out = bbox(c);
    await out.writeAsync(`${DIR}/${q.n}.png`);
    console.log("wrote", q.n, `${out.bitmap.width}x${out.bitmap.height}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
