import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static generation for auth routes
  // This ensures login page is always dynamically rendered
  experimental: {
    ppr: false,
  },
};

export default nextConfig;
