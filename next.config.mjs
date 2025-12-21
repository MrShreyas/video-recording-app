/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config, { dev }) {
    if (dev) {
      config.devtool = false
    }
    return config
  },
}

export default nextConfig
