/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://js.hcaptcha.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://assets.hcaptcha.com",
              "font-src 'self' https://fonts.gstatic.com https://assets.hcaptcha.com",
              "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://assets.hcaptcha.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paddle.com https://sandbox-api.paddle.com https://api.groq.com https://api.hcaptcha.com https://hcaptcha.com",
              "frame-src https://cdn.paddle.com https://sandbox-cdn.paddle.com https://newassets.hcaptcha.com",
              "media-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
      {
        // CORS for API routes — allow only our own origin in production
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_SITE_URL ?? "https://thakirni.com",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ]
  },
}

export default nextConfig
