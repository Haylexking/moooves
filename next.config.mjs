/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enforce ESLint during builds to catch issues early
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enforce type checks during builds
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
