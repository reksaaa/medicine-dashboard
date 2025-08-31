/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Set to false to avoid double-rendering in development
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Remove the custom webpack config as it's interfering with Next.js's built-in HMR
};

export default nextConfig;
