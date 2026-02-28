import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ["unrealistically-unbungling-milania.ngrok-free.dev"],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    proxyTimeout: 300_000, // 5 minutes — needed for multi-screen AI generation
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
