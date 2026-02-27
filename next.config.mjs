/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark swisseph as an external package so Next.js does not
  // attempt to bundle this native addon through webpack.
  // It will be resolved at runtime by Node.js in server context only.
  experimental: {
    serverComponentsExternalPackages: ['swisseph'],
  },

  webpack(config, { isServer }) {
    if (isServer) {
      // Also exclude from webpack bundling for API routes and Server Actions
      config.externals = Array.isArray(config.externals)
        ? [...config.externals, 'swisseph']
        : ['swisseph'];
    }
    return config;
  },
};

export default nextConfig;
