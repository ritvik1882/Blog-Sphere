
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  devIndicators: false,

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allows any hostname for HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Allows any hostname for HTTP
      },
    ],
  },
};

export default nextConfig;
