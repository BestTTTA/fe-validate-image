/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    images: {
      unoptimized: true
    },
    experimental: {
      serverActions: {
        bodySizeLimit: '50gb'
      }
    }
  };
  
  export default nextConfig;