const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

const moduleExports = withPWA({
  images: {
    domains: ['ipfs.io', 'ik.imagekit.io']
  },
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching
  },
  reactStrictMode: process.env.NODE_ENV === 'production',
  poweredByHeader: false
})

module.exports = moduleExports
