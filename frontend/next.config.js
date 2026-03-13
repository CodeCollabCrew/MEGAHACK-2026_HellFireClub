/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // disable double renders in dev
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
