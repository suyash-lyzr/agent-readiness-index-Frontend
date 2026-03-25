/**
 * Backend base URL for API proxying (Vercel → Railway).
 * Prefer https for remote hosts so the proxy never follows http→https redirects
 * (some intermediaries retry redirected POSTs as GET → 405 on FastAPI).
 */
export function normalizeBackendUrl(raw: string | undefined): string {
  const fallback = 'http://127.0.0.1:8000'
  if (!raw || !String(raw).trim()) return fallback
  let u = String(raw).trim().replace(/\/$/, '')
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`
  if (
    u.startsWith('http://') &&
    !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(u)
  ) {
    u = `https://${u.slice('http://'.length)}`
  }
  return u
}
