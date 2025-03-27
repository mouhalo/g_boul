/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Amélioration du Fast Refresh
  webpack: (config, { dev, isServer }) => {
    // Activer le Fast Refresh en mode développement
    if (dev && !isServer) {
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
    }
    return config;
  },
}

module.exports = nextConfig
