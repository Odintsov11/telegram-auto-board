/** @type {import('next').NextConfig} */
const path = require('path')

const API_URL = process.env.NEXT_PUBLIC_API_URL

const nextConfig = {
  images: {
    domains: ['api.telegram.org'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001/api/:path*'
            : `${API_URL}/:path*`,  // вот здесь важный правка
      },
    ]
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src')
    return config
  },
}

module.exports = nextConfig
