'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle, Target, Database, Settings2, Server, Users, Shield } from 'lucide-react'

interface PillarScore {
  score: number
  weight: number
  weighted_score: number
  reasoning: string
  evidence: string[]
  gaps: string[]
}

interface Props {
  pillarKey: string
  label: string
  score: PillarScore
  delay?: number
}

const PILLAR_ICONS: Record<string, React.ElementType> = {
  use_case_clarity: Target,
  data_readiness: Database,
  process_readiness: Settings2,
  tech_infrastructure: Server,
  people_culture: Users,
  governance_compliance: Shield,
}

function getScoreColor(score: number) {
  if (score >= 75) return 'text-emerald-700'
  if (score >= 50) return 'text-primary'
  if (score >= 25) return 'text-amber-700'
  return 'text-red-700'
}

function getBarColor(score: number) {
  if (score >= 75) return 'bg-emerald-600'
  if (score >= 50) return 'bg-primary'
  if (score >= 25) return 'bg-amber-600'
  return 'bg-red-600'
}

function getStatusLabel(score: number) {
  if (score >= 75) return { label: 'Strong', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (score >= 50) return { label: 'Good', color: 'text-primary bg-primary/5 border-primary/20' }
  if (score >= 25) return { label: 'Developing', color: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' }
}

export default function PillarCard({ pillarKey, label, score, delay = 0 }: Props) {
  const Icon = PILLAR_ICONS[pillarKey] || Target
  const status = getStatusLabel(score.score)
  const hasDetails = score.evidence.length > 0 || score.gaps.length > 0

  return (
    <div
      className="card-base rounded-2xl overflow-hidden flex flex-col h-full"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-6 flex-1 flex flex-col">
        {/* Header row: icon + label + status badge + score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-foreground text-lg">{label}</h3>
              <span className={cn('type-eyebrow px-2 py-0.5 rounded border mt-1 inline-block', status.color)}>
                {status.label}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className={cn('text-3xl font-serif font-bold leading-none', getScoreColor(score.score))}>
              {Math.round(score.score)}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wider font-medium">/ 100</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', getBarColor(score.score))}
            style={{ width: `${score.score}%` }}
          />
        </div>

        {/* Weight + contribution */}
        <div className="flex items-center justify-between text-xs mb-5 pb-5 border-b border-border/60">
          <span className="text-muted-foreground">
            Weight: <span className="text-foreground font-medium">{Math.round(score.weight * 100)}%</span>
          </span>
          <span className="text-muted-foreground">
            Contributes <span className="text-foreground font-medium">{score.weighted_score.toFixed(1)} pts</span>
          </span>
        </div>

        {/* One-line reasoning */}
        {score.reasoning && (
          <p className="text-sm text-foreground leading-relaxed mb-6 font-medium">"{score.reasoning}"</p>
        )}

        {/* Details (Evidence & Gaps) automatically expanded */}
        <div className="space-y-4 mt-auto">
          {score.evidence.length > 0 && (
            <div>
              <h4 className="type-eyebrow text-emerald-700 mb-2">Evidence</h4>
              <div className="space-y-2">
                {score.evidence.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
          {score.gaps.length > 0 && (
            <div>
              <h4 className="type-eyebrow text-red-700 mb-2 mt-4">Critical Gaps</h4>
              <div className="space-y-2">
                {score.gaps.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" strokeWidth={2} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
