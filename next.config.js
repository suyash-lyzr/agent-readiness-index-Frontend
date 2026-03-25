/** @type {import('next').NextConfig} */
// Proxy /api/* → FastAPI. Set BACKEND_URL in Vercel (e.g. https://api.yourdomain.com) — no trailing slash.
const backendBase =
  process.env.BACKEND_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000'

if (process.env.VERCEL === '1' && !process.env.BACKEND_URL) {
  throw new Error(
    'BACKEND_URL is required on Vercel. Add it under Project → Settings → Environment Variables ' +
      '(e.g. https://your-backend.railway.app).',
  )
}

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
