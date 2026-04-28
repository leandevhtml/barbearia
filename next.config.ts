import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore type errors during build (Vercel)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
