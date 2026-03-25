import { NextRequest, NextResponse } from 'next/server'
import { normalizeBackendUrl } from '@/lib/backend-url'

export const runtime = 'nodejs'

async function proxy(
  request: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const base = normalizeBackendUrl(process.env.BACKEND_URL)
  const subpath = pathSegments.join('/')
  const target = new URL(`${base}/api/${subpath}`)
  target.search = request.nextUrl.search

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const k = key.toLowerCase()
    if (['host', 'connection'].includes(k)) return
    headers.set(key, value)
  })

  const method = request.method
  const hasBody = !['GET', 'HEAD'].includes(method)
  const body = hasBody ? await request.arrayBuffer() : undefined

  const res = await fetch(target.toString(), {
    method,
    headers,
    body: body && body.byteLength > 0 ? body : undefined,
    redirect: 'manual',
  })

  const out = new Headers(res.headers)
  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: out,
  })
}

export async function GET(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}

export async function POST(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}

export async function PUT(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}

export async function OPTIONS(
  request: NextRequest,
  ctx: { params: { path: string[] } },
) {
  return proxy(request, ctx.params.path)
}
