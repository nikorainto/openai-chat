import withPWA from '@ducanh2912/next-pwa'

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
}

const nextConfig = {
  turbopack: {
    // Configure supported loaders
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
    // Configure module resolution
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
}

export default withPWA(pwaConfig)(nextConfig)
