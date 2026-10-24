import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Standalone output is for self-hosting. Vercel handles its own output format.
  output: process.env.VERCEL ? undefined : 'standalone',
  serverExternalPackages: ['@electric-sql/pglite'],
  transpilePackages: ['motion'],
};

export default nextConfig;
