import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Image optimization domains (add your domain hosting logos if needed)
  images: {
    domains: [],
  },
};

export default nextConfig;
