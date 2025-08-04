import type { NextConfig } from "next";
const webpack = require('webpack');

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      stream: false,
      crypto: false,
    };
    
    // Add Buffer polyfill
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    
    // Ignore optional dependencies that cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@aws-sdk/client-s3': false,
      '@aws-sdk/client-dynamodb': false,
    };
    
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
    ],
  },
};

export default nextConfig;
