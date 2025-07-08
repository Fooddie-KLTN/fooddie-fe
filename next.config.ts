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
  ignoreBuildErrors: true, // Ignore build errors
};

export default nextConfig;
