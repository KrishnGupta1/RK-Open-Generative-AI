/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['studio', 'ai-agent', 'workflow-builder', 'design-agent'],
  // Standalone keeps the Docker image small (no node_modules copy step) —
  // see Dockerfile. Safe to keep on for Vercel too.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      // "/" is the media studio again (original behaviour). The brand landing
      // page moved to "/home" — these aliases keep old links working.
      { source: '/landing', destination: '/home', permanent: false },
      { source: '/about', destination: '/home', permanent: false },
    ];
  },
};

export default nextConfig;
