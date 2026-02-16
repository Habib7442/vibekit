import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    proxyTimeout: 300_000, // 5 minutes — needed for multi-screen AI generation
  },
};

export default nextConfig;
