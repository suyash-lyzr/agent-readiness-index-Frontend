'use client'

import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import PillarCard from './PillarCard'
import PillarRadarChart from './PillarRadarChart'
import TransparencyPanel from './TransparencyPanel'
import ScoringMethodology from './ScoringMethodology'
import { Download, RefreshCw, CheckCircle2, AlertCircle, Loader2, TrendingUp, TrendingDown, Target, Database, Settings2, Server, Users, Shield } from 'lucide-react'

interface PillarScore {
  score: number
  weight: number
  weighted_score: number
  reasoning: string
  evidence: string[]
  gaps: string[]
}

interface ScoreData {
  overall_score: number
  tier: string
  pillar_scores: Record<string, PillarScore>
  top_strengths: string[]
  critical_gaps: string[]
  transparency: {
    extracted_from_url?: string[]
    extracted_from_pdf?: string[]
    inferred?: string[]
    from_survey?: string[]
    questions_skipped?: string[]
  }
}

interface Props {
  sessionId: string
  scoreData: ScoreData
}

const PILLAR_CONFIG = [
  { key: 'use_case_clarity', label: 'AI Use Cases', Icon: Target },
  { key: 'data_readiness', label: 'Data & Access', Icon: Database },
  { key: 'process_readiness', label: 'Workflows', Icon: Settings2 },
  { key: 'tech_infrastructure', label: 'Technology', Icon: Server },
  { key: 'people_culture', label: 'Team Readiness', Icon: Users },
  { key: 'governance_compliance', label: 'Security & Compliance', Icon: Shield },
]

function getTierColors(tier: string) {
  switch (tier) {
    case 'AI Native': return { ring: '#059669', text: 'text-emerald-700', badge: 'text-emerald-700 border-emerald-600/30 bg-emerald-50' }
    case 'AI Scaling': return { ring: 'hsl(26 35% 35%)', text: 'text-primary', badge: 'text-primary border-primary/30 bg-primary/5' }
    case 'AI Experimenting': return { ring: '#b45309', text: 'text-amber-700', badge: 'text-amber-700 border-amber-600/30 bg-amber-50' }
    default: return { ring: '#dc2626', text: 'text-red-700', badge: 'text-red-700 border-red-600/30 bg-red-50' }
  }
}


export default function ResultsDashboard({ sessionId, scoreData }: Props) {
  const [scoreAnimated, setScoreAnimated] = useState(0)
  const [strokeOffset, setStrokeOffset] = useState(502.4)
  const [isDownloading, setIsDownloading] = useState(false)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const score = scoreData.overall_score
  const tier = scoreData.tier
  const tierColors = getTierColors(tier)

  const circumference = 502.4
  const targetOffset = circumference - (score / 100) * circumference

  useEffect(() => {
    const target = Math.round(score)
    const steps = 60
    const increment = target / steps
    let current = 0

    animRef.current = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        if (animRef.current) clearInterval(animRef.current)
      }
      setScoreAnimated(Math.round(current))
    }, 1500 / steps)

    setTimeout(() => setStrokeOffset(targetOffset), 100)

    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [score, targetOffset])

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/report/${sessionId}`)
      if (!res.ok) throw new Error('Failed to generate report')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `agent-readiness-report-${sessionId.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Download failed:', e)
    } finally {
      setIsDownloading(false)
    }
  }

  // Sort pillars by score for the ranked list
  const sortedPillars = [...PILLAR_CONFIG]
    .map(p => ({ ...p, score: scoreData.pillar_scores[p.key] }))
    .filter(p => p.score)
    .sort((a, b) => b.score.score - a.score.score)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">

      {/* SECTION 1: Executive Summary — compact */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
        {/* Overall Score — 2 cols */}
        <div className="lg:col-span-2 card-glass-lg rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 pointer-events-none" />
          
          <span className={cn('type-eyebrow px-3 py-1 rounded-full border mb-5 relative z-10 text-xs font-semibold tracking-widest uppercase', tierColors.badge)}>
            {tier}
          </span>

          <div className="relative mb-5 z-10">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="72" fill="none" stroke="hsl(var(--border) / 0.4)" strokeWidth="10" />
              <circle
                cx="80" cy="80" r="72" fill="none"
                stroke={tierColors.ring}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn('font-serif font-bold text-5xl tracking-tight', tierColors.text)}>
                {scoreAnimated}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mt-1">Out of 100</div>
            </div>
          </div>

          <div className="flex items-center gap-5 w-full justify-center border-t border-border/50 pt-5 relative z-10 mb-5">
            <div className="text-center">
              <div className="font-serif font-semibold text-lg text-emerald-700">{scoreData.top_strengths.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Strengths</div>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div className="text-center">
              <div className="font-serif font-semibold text-lg text-red-700">{scoreData.critical_gaps.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Gaps</div>
            </div>
            <div className="w-px h-7 bg-border/60" />
            <div className="text-center">
              <div className="font-serif font-semibold text-lg text-foreground">6</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Pillars</div>
            </div>
          </div>

          <div className="flex gap-2 w-full relative z-10">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" strokeWidth={2} />}
              {isDownloading ? 'Generating...' : 'PDF Report'}
            </button>
            <a
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 border-border text-foreground text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2} />
              New
            </a>
          </div>
        </div>

        {/* Radar Chart — 3 cols */}
        <div className="lg:col-span-3 card-base rounded-2xl p-5 flex flex-col">
          <div className="mb-2 px-1">
            <h2 className="type-eyebrow text-muted-foreground">Readiness Profile</h2>
            <p className="font-serif text-lg font-semibold text-foreground mt-0.5">Six Dimensions of Agentic AI</p>
          </div>
          <div className="flex-1 min-h-[280px] -mx-2">
            <PillarRadarChart pillarScores={scoreData.pillar_scores} />
          </div>
        </div>
      </section>

      {/* SECTION 2: Key Findings (Strengths & Gaps) */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-foreground px-1">Key Findings</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-base rounded-2xl p-6 sm:p-8 border-t-4 border-t-emerald-500">
            <h3 className="type-eyebrow text-emerald-700 flex items-center gap-2 mb-6 text-sm">
              <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
              Top Strengths
            </h3>
            <div className="space-y-4">
              {scoreData.top_strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-base rounded-2xl p-6 sm:p-8 border-t-4 border-t-red-500">
            <h3 className="type-eyebrow text-red-700 flex items-center gap-2 mb-6 text-sm">
              <TrendingDown className="w-4 h-4" strokeWidth={2.5} />
              Critical Gaps
            </h3>
            <div className="space-y-4">
              {scoreData.critical_gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{g}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Detailed Pillar Scores */}
      <section className="space-y-5">
        <div className="px-1">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Dimension Breakdown</h2>
          <p className="text-sm text-muted-foreground">Detailed analysis of the six core pillars of AI readiness, ranked from strongest to weakest.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedPillars.map(({ key, label, Icon }, i) => {
            const pillarScore = scoreData.pillar_scores[key]
            if (!pillarScore) return null
            return (
              <PillarCard
                key={key}
                pillarKey={key}
                label={label}
                score={pillarScore}
                delay={i * 100}
              />
            )
          })}
        </div>
      </section>

      {/* SECTION 4: Methodology & Transparency — premium, always visible */}
      <section className="space-y-5">
        <div className="px-1">
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">How We Scored You</h2>
          <p className="text-sm text-muted-foreground">Full transparency into the methodology and data behind your readiness score.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ScoringMethodology />
          <TransparencyPanel transparency={scoreData.transparency} />
        </div>
      </section>

    </div>
  )
}
