/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  // Standalone keeps the Docker image small (no node_modules copy step) —
  // see Dockerfile. Safe to keep on for Vercel too.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // Old root used to bounce straight to the media studio; the brand
      // landing page now lives at "/".
      { source: '/home', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
