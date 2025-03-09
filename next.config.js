/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    unoptimized: false,
  },
}

module.exports = nextConfig
