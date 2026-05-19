import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.cdn.filesafe.space',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/free-book/workshop',
        destination: '/workshop',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
