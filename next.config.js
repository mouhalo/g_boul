/** @type {import('next').NextConfig} */
// Nous définissons la version directement ici pour éviter d'utiliser require
// Cette valeur doit correspondre à celle dans package.json
const APP_VERSION = '0.1.0';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
  env: {
    APP_VERSION: APP_VERSION,
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
