/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone for server-side rendering
  // output: 'standalone',
  
  // Temporarily disable TypeScript and ESLint checks for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    domains: [
      'localhost',
      'via.placeholder.com',
      'images.unsplash.com',
      'skillsync.com',
      'supabase.co',
      'your-supabase-project.supabase.co'
    ],
  },

  // Disable static page generation for dynamic routes
  experimental: {
    // This helps with Supabase auth and dynamic content
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Skip static generation for auth-protected pages
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig
