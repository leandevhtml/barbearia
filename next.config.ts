import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore lint errors during build (Vercel)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore type errors during build (Vercel)
    ignoreBuildErrors: true,
  }
};

export default nextConfig;

