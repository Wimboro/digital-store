import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // External packages for server components
  serverExternalPackages: ['@prisma/client'],
  // Configuration for Cloudflare Pages
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Static export for Pages deployment (temporary solution)
  output: process.env.STATIC_EXPORT ? 'export' : undefined,
};

export default nextConfig;