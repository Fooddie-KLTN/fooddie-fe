import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https", // or http
        hostname: "**",
      },
    ],
  },
  typescript: {
    // This option allows you to ignore type errors during the build process.
    // Use with caution, as it may hide potential issues in your code.
    ignoreBuildErrors: true,
  },
  eslint: {
    // This option allows you to ignore ESLint errors during the build process.
    // Use with caution, as it may hide potential issues in your code.
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
