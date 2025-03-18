/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['119.59.99.192'], // เพิ่มโดเมนที่อนุญาต
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50gb'
    }
  },

};

export default nextConfig;