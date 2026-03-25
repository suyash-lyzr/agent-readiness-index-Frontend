/** @type {import('next').NextConfig} */
// Proxy /api/* → FastAPI. Set BACKEND_URL in Vercel (e.g. https://api.yourdomain.com) — no trailing slash.
const backendBase =
  process.env.BACKEND_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000'

// Warn only — do not throw: lets the first Vercel deploy succeed before Railway URL exists.
if (process.env.VERCEL === '1' && !process.env.BACKEND_URL) {
  console.warn(
    '[next.config] BACKEND_URL is not set. Add your Railway API URL under Vercel → Settings → Environment Variables ' +
      '(e.g. https://xxx.up.railway.app) and redeploy, or API requests will fail.',
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
