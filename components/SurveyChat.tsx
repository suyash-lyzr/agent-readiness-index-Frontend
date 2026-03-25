'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Zap, CheckCircle, CircleDot, ChevronLeft } from 'lucide-react'

interface ChatMessage {
  role: 'agent' | 'user'
  content: string
  options?: string[]
}

interface SurveyQuestion {
  id: string
  pillar: string
  question: string
  options: string[]
}

interface Props {
  chatHistory: ChatMessage[]
  currentQuestion: SurveyQuestion | null
  onAnswer: (answer: string) => void
  onBack?: () => void
  canGoBack: boolean
  surveyComplete: boolean
  isScoring: boolean
  questionIndex: number
  totalQuestions: number
  sessionId: string
}

export default function SurveyChat({
  chatHistory,
  currentQuestion,
  onAnswer,
  onBack,
  canGoBack,
  surveyComplete,
  isScoring,
  questionIndex,
  totalQuestions,
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isWaiting = chatHistory.length === 0
  const lastAgentMsg = [...chatHistory].reverse().find((m) => m.role === 'agent')
  const showOptions = !surveyComplete && !isScoring && lastAgentMsg?.options && lastAgentMsg.options.length > 0
  const lastMsg = chatHistory[chatHistory.length - 1]
  const awaitingUserInput = showOptions && lastMsg?.role === 'agent'

  const progressPct = totalQuestions > 0 ? Math.min(((questionIndex + (surveyComplete ? 1 : 0)) / totalQuestions) * 100, 100) : 0
  const PILLAR_ICON_MAP: Record<string, string> = {
    'About Your Company': 'Company Profile',
    'Your Data': 'Data & Access',
    'Your Workflows': 'Workflows',
    'Your Technology': 'Technology',
    'Your Team': 'Team Readiness',
    'Your AI Goals': 'AI Use Cases',
    'Security & Compliance': 'Compliance',
    // Legacy / fallback mappings
    'Data Readiness': 'Data & Access',
    'Process Readiness': 'Workflows',
    'Tech Infrastructure': 'Technology',
    'People & Culture': 'Team Readiness',
    'Use Case Clarity': 'AI Use Cases',
    'Governance & Compliance': 'Compliance',
  }
  const pillarLabel = currentQuestion
    ? PILLAR_ICON_MAP[currentQuestion.pillar] ?? currentQuestion.pillar
    : null
  const currentPrompt = awaitingUserInput
    ? lastAgentMsg?.content ?? currentQuestion?.question ?? ''
    : currentQuestion?.question ?? lastAgentMsg?.content ?? ''
  const introMessage = chatHistory.find((msg) => msg.role === 'agent' && !msg.options)?.content

  return (
    <div className="h-full flex flex-col">
      <div className="card-glass-lg rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 240px)', maxHeight: '520px' }}>
        <div className="px-5 py-4 border-b border-border space-y-3 bg-white/45">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Readiness Assessment</h2>
                <p className="text-[11px] text-muted-foreground">
                  {isWaiting
                    ? 'Preparing your tailored questions'
                    : surveyComplete
                    ? 'Assessment complete'
                    : totalQuestions > 0
                    ? `Question ${Math.min(questionIndex + 1, totalQuestions)} of ${totalQuestions}`
                    : 'Loading questions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canGoBack && !surveyComplete && !isScoring && (
                <button
                  onClick={onBack}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 transition-all duration-150"
                >
                  <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
                  Back
                </button>
              )}
              {pillarLabel && !surveyComplete && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wide bg-primary/10 text-primary">
                  <CircleDot className="w-3 h-3" strokeWidth={2} />
                  {pillarLabel}
                </span>
              )}
            </div>
          </div>

          {totalQuestions > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Progress</span>
                <span className="text-[10px] font-semibold text-foreground">{Math.round(progressPct)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}
        </div>

        {isWaiting && !isScoring && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <Zap className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            
            <h3 className="font-serif font-semibold text-xl text-foreground mb-3 max-w-md">
              Preparing your targeted questions
            </h3>
            
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We have extracted the key signals from your content. To generate a highly accurate readiness score, we want to understand a few more things about your internal operations.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-primary bg-primary/5 py-2 px-4 rounded-lg inline-flex">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Generating list of questions...
              </div>
            </div>
          </div>
        )}

        {!isWaiting && !isScoring && !surveyComplete && currentPrompt && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            <div className="max-w-3xl">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tracking-wide">
                  <CircleDot className="w-3 h-3" strokeWidth={2} />
                  {pillarLabel || 'Assessment'}
                </div>
                <h3 className="font-serif font-semibold text-xl sm:text-2xl text-foreground leading-snug">
                  {currentPrompt}
                </h3>
                {introMessage && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {introMessage}
                  </p>
                )}
              </div>
            </div>

            {awaitingUserInput && lastAgentMsg?.options && (
              <div className="max-w-3xl">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Select an option to continue</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {lastAgentMsg.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => onAnswer(option)}
                      className="group relative flex items-center w-full text-left px-4 py-3.5 rounded-xl bg-white border-2 border-primary/10 shadow-sm hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <span className="flex items-center gap-3 w-full">
                        <span className="w-7 h-7 rounded-full bg-primary/5 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center text-[11px] font-bold text-primary shrink-0 transition-colors">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="font-medium text-sm text-foreground leading-relaxed pr-7">{option}</span>
                      </span>
                      <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle className="w-4 h-4 text-primary" strokeWidth={2} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isScoring && (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 gap-6">
            {/* Animated ring */}
            <div className="relative flex items-center justify-center">
              {/* Pulsing background rings */}
              <div className="absolute w-32 h-32 rounded-full bg-primary/8 scoring-pulse" />
              <div className="absolute w-24 h-24 rounded-full bg-primary/10 scoring-pulse-2" />
              <svg width="80" height="80" viewBox="0 0 120 120" className="scoring-ring">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="6" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" className="scoring-ring-arc" style={{ transformOrigin: '60px 60px' }} />
              </svg>
              <div className="absolute w-10 h-10 rounded-full bg-white shadow-md border border-primary/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-2 w-full max-w-sm px-6">
              <h3 className="font-serif font-semibold text-xl text-foreground">Generating your score</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Evaluating all six dimensions and building your personalised readiness report.
              </p>
            </div>

            {/* 6-pillar progress dots */}
            <div className="space-y-2 w-full max-w-xs">
              {[
                'AI Use Cases',
                'Data & Access',
                'Workflows',
                'Technology',
                'Team Readiness',
                'Security & Compliance',
              ].map((pillar, i) => (
                <div key={pillar} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full bg-primary shrink-0"
                    style={{ animation: `dot-sweep 1.8s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }}
                  />
                  <div className="flex-1 h-1.5 rounded-full bg-primary/10 relative overflow-hidden shimmer-bar">
                    <div
                      className="h-full bg-primary/30 rounded-full"
                      style={{
                        width: '100%',
                        animation: `dot-sweep 1.8s ease-in-out infinite`,
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground w-36 shrink-0">{pillar}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground/60 w-full text-center">Usually takes about 20 seconds</p>
          </div>
        )}

        {surveyComplete && !isScoring && (
          <div className="p-6">
            <div className="rounded-2xl card-inset p-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" strokeWidth={2} />
                Assessment complete — preparing results...
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
