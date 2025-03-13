/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
  images: {
    unoptimized: false,
  },
}

module.exports = nextConfig
