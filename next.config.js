/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables that should be available to the browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'RealToken',
    NEXT_PUBLIC_APP_DESCRIPTION: 'Real Estate Tokenization with Stablecoin Payments',
  },

  // Webpack configuration for crypto polyfills
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;