export default {
  logo: (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <img src="/logo/mark.png" alt="" width={24} height={24} />
      <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.01em" }}>
        Lit<span style={{ color: "#5B86FF" }}>Zap</span>
      </span>
      <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.55 }}>Docs</span>
    </span>
  ),
  project: {
    link: "https://github.com/Litzap/litzap",
  },
  docsRepositoryBase: "https://github.com/Litzap/litzap/tree/main/docs-site",
  color: {
    hue: 222,
    saturation: 90,
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" href="/favicon.png" type="image/png" />
      <meta property="og:title" content="LitZap Docs" />
      <meta property="og:description" content="The money app for Litecoin's LitVM — get paid by anyone, even people not yet in crypto." />
    </>
  ),
  footer: {
    text: (
      <span>
        © {new Date().getFullYear()} LitZap · Built on Litecoin's LitVM ·{" "}
        <a href="https://litzap.xyz" style={{ textDecoration: "underline" }}>litzap.xyz</a>
      </span>
    ),
  },
  sidebar: {
    defaultMenuCollapseLevel: 1,
    toggleButton: true,
  },
  toc: {
    float: true,
    title: "On this page",
  },
  navigation: {
    prev: true,
    next: true,
  },
  darkMode: true,
  primaryHue: 222,
};
