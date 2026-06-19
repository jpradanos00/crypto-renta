import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  // Disable all telemetry and external requests
  experimental: {
    // No external fetches in static export
  },
};

export default nextConfig;
