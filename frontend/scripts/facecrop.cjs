const Jimp = require("jimp");
(async () => {
  const img = await Jimp.read("public/zapster_raw/zapster_idle.png");
  const W = img.bitmap.width, H = img.bitmap.height;
  console.log("idle", W, H);
  // square head crop near top-center
  const side = Math.round(W * 0.64);
  const x = Math.round(W * 0.18);
  const y = Math.round(H * 0.015);
  const face = img.clone().crop(x, y, Math.min(side, W - x), Math.min(side, H - y));
  await face.writeAsync("public/zapster_raw/zapster_face.png");
  console.log("face", face.bitmap.width, face.bitmap.height);
})().catch((e) => { console.error(e); process.exit(1); });
