/** @type {import('next').NextConfig} */
// API traffic is proxied in app/api/[...path]/route.ts (preserves POST bodies and methods).
// Keep BACKEND_URL as https://… on Vercel to avoid http→https redirects downgrading POST→GET.

// Warn only — do not throw: lets the first Vercel deploy succeed before Railway URL exists.
if (process.env.VERCEL === '1' && !process.env.BACKEND_URL) {
  console.warn(
    '[next.config] BACKEND_URL is not set. Add your Railway API URL under Vercel → Settings → Environment Variables ' +
      '(e.g. https://xxx.up.railway.app) and redeploy, or API requests will fail.',
  )
}

const nextConfig = {}

module.exports = nextConfig
