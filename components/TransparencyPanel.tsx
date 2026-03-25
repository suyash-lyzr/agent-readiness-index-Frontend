'use client'

import { cn } from '@/lib/utils'
import { Eye, Globe, FileText, Search, MessageSquare, SkipForward } from 'lucide-react'

interface TransparencyData {
  extracted_from_url?: string[]
  extracted_from_pdf?: string[]
  inferred?: string[]
  from_survey?: string[]
  questions_skipped?: string[]
}

interface Props {
  transparency: TransparencyData
  className?: string
}

const SECTIONS = [
  { key: 'extracted_from_url' as keyof TransparencyData, label: 'From URL', Icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'extracted_from_pdf' as keyof TransparencyData, label: 'From PDF', Icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { key: 'inferred' as keyof TransparencyData, label: 'Inferred', Icon: Search, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'from_survey' as keyof TransparencyData, label: 'From Survey', Icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'questions_skipped' as keyof TransparencyData, label: 'Skipped', Icon: SkipForward, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
]

export default function TransparencyPanel({ transparency, className }: Props) {
  const totalItems = SECTIONS.reduce((sum, s) => sum + (transparency[s.key]?.length || 0), 0)
  const activeSections = SECTIONS.filter(s => (transparency[s.key]?.length || 0) > 0)

  return (
    <div className={cn('card-base rounded-2xl overflow-hidden flex flex-col', className)}>
      <div className="p-5 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
            <Eye className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Data Transparency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{totalItems} data points used for scoring</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[600px]">
        {/* Source breakdown badges */}
        <div className="flex flex-wrap gap-2">
          {activeSections.map(({ key, label, Icon, color, bg, border }) => (
            <div key={key} className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold', bg, border, color)}>
              <Icon className="w-3 h-3" strokeWidth={2} />
              {label}
              <span className="ml-0.5 opacity-70">({transparency[key]?.length})</span>
            </div>
          ))}
        </div>

        {/* Data points per source */}
        <div className="space-y-4 flex-1">
          {activeSections.map(({ key, label, Icon, color, bg, border }) => {
            const items = transparency[key] || []
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', bg, 'border', border)}>
                    <Icon className={cn('w-2.5 h-2.5', color)} strokeWidth={2} />
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">{label}</h4>
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] text-muted-foreground font-medium">{items.length} items</span>
                </div>
                <div className="space-y-1.5 ml-7">
                  {items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-foreground/80 rounded-lg px-3 py-2 card-inset"
                    >
                      <span className={cn('w-1 h-1 rounded-full shrink-0 mt-1.5', color.replace('text-', 'bg-'))} />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {totalItems === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground/60 italic">No transparency data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
