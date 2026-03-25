'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Target, Database, Settings2, Server, Users, Shield,
  Globe, MessageSquare, ArrowRight, Loader2,
  Link2, Upload, CheckCircle, XCircle, Zap, Activity,
  BarChart3
} from 'lucide-react'

const PILLARS = [
  { name: 'AI Use Cases', Icon: Target, weight: '20%', desc: 'What problems AI can solve?' },
  { name: 'Data & Access', Icon: Database, weight: '20%', desc: 'Organized, accessible data' },
  { name: 'Workflows', Icon: Settings2, weight: '20%', desc: 'Documented, repeatable processes' },
  { name: 'Technology', Icon: Server, weight: '15%', desc: 'Modern, connected tech stack' },
  { name: 'Team Readiness', Icon: Users, weight: '15%', desc: 'Leadership & AI literacy' },
  { name: 'Security & Compliance', Icon: Shield, weight: '10%', desc: 'Data policies in place' },
]

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSource, setLoadingSource] = useState<'url' | 'pdf' | 'survey' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlSubmit = async () => {
    if (!url.trim()) return
    setIsLoading(true); setLoadingSource('url'); setError(null)
    try {
      const rawUrl = url.trim()
      const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
      const res = await fetch('/api/analyze/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to analyze URL') }
      const data = await res.json()
      router.push(`/survey/${data.session_id}`)
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    finally { setIsLoading(false); setLoadingSource(null) }
  }

  const handlePdfSubmit = async () => {
    if (!selectedFile) return
    setIsLoading(true); setLoadingSource('pdf'); setError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await fetch('/api/analyze/pdf', { method: 'POST', body: formData })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to analyze PDF') }
      const data = await res.json()
      router.push(`/survey/${data.session_id}`)
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    finally { setIsLoading(false); setLoadingSource(null) }
  }

  const handleSurveyOnly = async () => {
    setIsLoading(true); setLoadingSource('survey'); setError(null)
    try {
      const res = await fetch('/api/survey/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Failed to start survey') }
      const data = await res.json()
      router.push(`/survey/${data.session_id}`)
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    finally { setIsLoading(false); setLoadingSource(null) }
  }

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setSelectedFile(file)
  }

  return (
    <div className="min-h-screen flex flex-col justify-center max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-0">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] gap-10 lg:gap-12 lg:items-stretch lg:min-h-[600px]">
        {/* LEFT SIDE - Content */}
        <div className="flex flex-col h-full justify-between">
          <div className="relative mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-primary/20 bg-white/60 mb-6 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Lyzr Agent Assessment</span>
            </div>

            <h1 className="text-5xl lg:text-6xl text-foreground leading-[1.08] tracking-tight mb-6" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}>
              Is your business <br />
              ready for <br />
              <span className="text-primary italic">AI Agents?</span>
            </h1>

            <p className="text-muted-foreground text-base leading-relaxed max-w-md">
              A comprehensive diagnostic that evaluates your data, infrastructure, and workflows to determine your exact readiness for autonomous AI.
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center z-20 shadow-sm"><Target className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} /></div>
              <div className="w-10 h-10 rounded-full border-2 border-background bg-primary/10 flex items-center justify-center z-10 shadow-sm"><Activity className="w-4 h-4 text-primary" strokeWidth={1.5} /></div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fast & Actionable</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Under 5 minutes to complete</p>
            </div>
          </div>

          <div className="space-y-5 pt-8 border-t border-border/60">
            <p className="type-eyebrow text-muted-foreground mb-3">How it works</p>
            {[
              { icon: Zap, title: 'Share Context', desc: 'Share something as simple as a corporate deck, a website URL, or take a chat survey.' },
              { icon: Target, title: 'Agentic Analysis', desc: 'The agent analyzes your inputs to infer readiness signals and ask targeted questions.' },
              { icon: BarChart3, title: 'Detailed Report', desc: 'The agent will build a detailed report evaluating your readiness for autonomous AI.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-border flex items-center justify-center shrink-0 mt-0.5 group-hover:border-primary/40 group-hover:shadow-md transition-all">
                  <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 max-w-[340px] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - Inputs: single unified card */}
        <div className="flex flex-col gap-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
              <span>{error}</span>
            </div>
          )}

          <section className="card-glass-lg rounded-2xl shadow-lg border border-border/60 overflow-hidden">
            {/* Part 1: Quick Scan URL — highlighted */}
            <div className="p-6 sm:p-7 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(26 35% 96%) 0%, hsl(26 30% 92%) 50%, hsl(26 25% 89%) 100%)' }}>
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shadow-sm">
                    <Globe className="w-5 h-5 text-primary" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Scan your website</h2>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Paste your URL and get an instant readiness analysis</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-primary/15">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-primary/80">Live</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="https://yourcompany.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && url.trim() && !isLoading && handleUrlSubmit()}
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition-all bg-white border-2 border-primary/20 hover:border-primary/40 shadow-sm"
                  />
                </div>
                <button
                  onClick={handleUrlSubmit}
                  disabled={isLoading || !url.trim()}
                  className={cn(
                    'px-7 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0 min-w-[130px]',
                    url.trim() && !isLoading
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 hover:-translate-y-0.5'
                      : 'bg-primary/40 text-primary-foreground cursor-not-allowed'
                  )}
                >
                  {loadingSource === 'url' && isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ArrowRight className="w-4 h-4" strokeWidth={2.5} />}
                  Analyze
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-3 text-center relative z-10">The agent will crawl your site and extract readiness signals automatically</p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 px-6 py-3 bg-secondary/20">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest font-medium">or try another way</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Part 2: Upload PDF & Guided Survey */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-border/40">
              {/* Upload PDF */}
              <div className="p-5 hover:bg-secondary/20 transition-all group">
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f) }} className="hidden" disabled={isLoading} />
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedFile(null)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">Remove</button>
                      <button
                        onClick={handlePdfSubmit}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shadow-sm disabled:opacity-50"
                      >
                        {loadingSource === 'pdf' && isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />}
                        Analyze PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn('cursor-pointer transition-all', isDragOver && 'opacity-70')}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                      </div>
                      <div className="text-left">
                      <h3 className="text-sm font-medium text-foreground">Upload PDF</h3>
                      <p className="text-[13px] text-muted-foreground">Pitch deck or strategy doc</p>
                      </div>
                    </div>
                    <div className="border border-dashed border-border/60 rounded-lg py-2.5 text-center text-[10px] text-muted-foreground/60 group-hover:border-primary/30 transition-colors">
                      Drop or click &middot; Max 10MB
                    </div>
                  </div>
                )}
              </div>

              {/* Guided Survey */}
              <div className="p-5 hover:bg-secondary/20 transition-all group flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
                  </div>
                  <div>
                  <h3 className="text-sm font-medium text-foreground">Guided Survey</h3>
                  <p className="text-[13px] text-muted-foreground">Answer 10-12 questions</p>
                  </div>
                </div>
                <button
                  onClick={handleSurveyOnly}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-border/60 text-foreground text-xs font-medium hover:border-primary/30 hover:bg-secondary/50 transition-all disabled:opacity-50"
                >
                  {loadingSource === 'survey' && isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Start Survey
                </button>
              </div>
            </div>
          </section>

          {/* What we evaluate */}
          <section className="card-base rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <p className="type-eyebrow text-muted-foreground">What we evaluate</p>
              <span className="text-[11px] text-muted-foreground/60 font-medium">6 dimensions &middot; weighted scoring</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 flex-1">
              {PILLARS.map(({ name, Icon, weight, desc }) => (
                <div key={name} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      <span className="text-[10px] text-primary/70 font-bold">{weight}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
