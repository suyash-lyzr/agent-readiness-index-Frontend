/** @type {import('next').NextConfig} */
// Proxy /api/* → FastAPI. Next.js requires destination to start with http:// or https://
function normalizeBackendUrl(raw) {
  const fallback = 'http://127.0.0.1:8000'
  if (!raw || !String(raw).trim()) return fallback
  let u = String(raw).trim().replace(/\/$/, '')
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  return u
}

const backendBase = normalizeBackendUrl(process.env.BACKEND_URL)

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
