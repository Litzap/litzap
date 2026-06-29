/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Bundle the OG card fonts/mascots into the serverless functions that
  // render dynamic /u and /drop social images (read via fs at runtime).
  experimental: {
    // resvg is a native module — keep it external so webpack doesn't bundle the .node binary.
    serverComponentsExternalPackages: ["@resvg/resvg-js"],
    outputFileTracingIncludes: {
      "/u/[handle]/opengraph-image": ["./assets/og/**"],
      "/u/[handle]/twitter-image": ["./assets/og/**"],
      "/drop/[code]/opengraph-image": ["./assets/og/**"],
      "/drop/[code]/twitter-image": ["./assets/og/**"],
    },
  },
  webpack: (config, { dev }) => {
    // Privy/wagmi pull optional deps we don't use — ignore them so the build passes.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@stripe/crypto": false,
      "@farcaster/mini-app-solana": false,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    // Low-memory production build: process fewer modules in parallel and keep the
    // webpack cache on disk instead of in RAM. Trades some build speed for a much
    // lower peak heap so the build survives on memory-constrained machines.
    if (!dev) {
      config.parallelism = 1;
      if (config.cache) config.cache = { type: "filesystem" };
    }
    return config;
  },
};

export default nextConfig;
