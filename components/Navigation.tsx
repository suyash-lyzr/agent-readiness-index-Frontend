'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export function Navigation() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(1.4)', WebkitBackdropFilter: 'blur(20px) saturate(1.4)', borderBottom: '1px solid rgba(255,255,255,0.80)', boxShadow: '0 1px 12px rgba(120,90,50,0.07)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/images/lyzr-icon-black.png"
            alt="Lyzr"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-serif font-semibold text-foreground text-base tracking-tight">Agent Readiness</span>
            <span className="type-eyebrow text-primary">Index</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <span className="type-eyebrow text-muted-foreground hidden sm:block">Agentic Assessment</span>
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </nav>
  )
}

export function Footer() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <footer className="py-5 px-6 text-center" style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.70)' }}>
      <p className="type-caption text-muted-foreground">
        Agent Readiness Index &mdash; AI Assessment Platform
      </p>
    </footer>
  )
}
