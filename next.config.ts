import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Disable image optimization to save memory
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable all optimization features that use memory
  swcMinify: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
  // Essential for small storage
  output: 'standalone',
  distDir: '.next',
  // Reduce build output
  generateBuildId: () => 'build',
};

export default nextConfig;
