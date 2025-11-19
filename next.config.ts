import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Commenté pour activer les API routes (ne fonctionne pas avec output: 'export')
  // output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
