'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import SurveyChat from '@/components/SurveyChat'
import { cn } from '@/lib/utils'
import { Zap, CheckCircle2, XCircle, Loader2, Globe, Cpu, Building2, Signal, Shield, Wrench, Activity, Sparkles } from 'lucide-react'

interface ThinkingStep {
  step: string
  message: string
  status: 'in_progress' | 'complete' | 'error' | 'ready'
  questions?: string[]
  signals?: Record<string, string | string[]>
  timestamp?: number
}

interface SurveyQuestion {
  id: string
  pillar: string
  question: string
  options: string[]
}

interface SessionData {
  status: string
  questions_to_ask: string[]
  current_question_index: number
  extracted_signals: any
  survey_answers: Record<string, string>
  error?: string
}

function TypewriterText({
  text,
  speed = 35,
  onComplete,
}: {
  text: string
  speed?: number
  onComplete?: () => void
}) {
  const [visibleChars, setVisibleChars] = useState(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    setVisibleChars(0)
    if (!text) {
      onCompleteRef.current?.()
      return
    }

    let index = 0
    // Slower, more organic typing speed
    const timer = setInterval(() => {
      index += 1
      setVisibleChars(index)
      if (index >= text.length) {
        clearInterval(timer)
        onCompleteRef.current?.()
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  const typedText = text.slice(0, visibleChars)
  const done = visibleChars >= text.length

  return (
    <span>
      {typedText}
      {!done && <span className="typing-cursor">▍</span>}
    </span>
  )
}

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  'Industry': Building2,
  'Company Size': Building2,
  'Digital Maturity': Signal,
  'AI Mentions': Cpu,
  'Tech Stack': Wrench,
  'Compliance': Shield,
}

export default function SurveyPage() {
  const params = useParams()
  const sessionId = params.id as string
  const router = useRouter()

  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [isThinking, setIsThinking] = useState(true)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<SurveyQuestion | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [surveyComplete, setSurveyComplete] = useState(false)
  const [isScoring, setIsScoring] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    { role: 'agent' | 'user'; content: string; options?: string[] }[]
  >([])
  // Stack of question objects seen so far — used to go back
  const [questionHistory, setQuestionHistory] = useState<SurveyQuestion[]>([])
  
  // Track which step is currently typing out
  const [typingIndex, setTypingIndex] = useState(0)

  // Staged reveal for Phase 02 transition:
  // 'none' = still analyzing
  // 'signals' = show only extracted signals card
  // 'preparing' = show loader above signals ("generating questions...")
  // 'ready' = show assessment + activity feed, signals below
  const [revealStage, setRevealStage] = useState<'none' | 'signals' | 'preparing' | 'ready'>('none')
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const streamEndRef = useRef<HTMLDivElement>(null)
  const animatedUpToRef = useRef(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Phase: 'analyzing' | 'survey' | 'scoring'
  const phase = isThinking ? 'analyzing' : isScoring ? 'scoring' : 'survey'
  const showLiveWorkspace = phase === 'analyzing'

  // Auto-scroll when new steps arrive
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thinkingSteps])

  // Load questions once analysis is done
  const loadQuestions = async () => {
    try {
      const qRes = await fetch(`/api/survey/questions/${sessionId}`)
      if (!qRes.ok) return
      const qData = await qRes.json()
      if (qData.questions && qData.questions.length > 0) {
        setTotalQuestions(qData.questions.length)
        setCurrentQuestion(qData.questions[0])
        setQuestionIndex(0)
        setQuestionHistory([qData.questions[0]])
        setChatHistory([
          { role: 'agent', content: qData.questions[0].question, options: qData.questions[0].options },
        ])
      } else {
        setSurveyComplete(true)
        await triggerScoring()
      }
    } catch (e) {
      console.error('Failed to load questions:', e)
    }
  }

  // Polling: replaces SSE. Polls /api/session/{id} every 600ms and updates thinking steps.
  useEffect(() => {
    let stopped = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (!res.ok || stopped) return
        const data = await res.json()
        setSession(data)

        const steps: ThinkingStep[] = (data.thinking_steps || []).map((s: ThinkingStep) => ({ ...s }))

        // Track how many steps have been animated so far, so new ones trigger typewriter
        if (steps.length > animatedUpToRef.current) {
          animatedUpToRef.current = steps.length
        }
        setThinkingSteps(steps)

        const status = data.status
        if (status === 'awaiting_survey' || status === 'complete' || status === 'error') {
          stopped = true
          if (pollingRef.current) clearInterval(pollingRef.current)
          setAnalysisComplete(true)
        }
      } catch {}
    }

    poll()
    pollingRef.current = setInterval(poll, 600)
    return () => {
      stopped = true
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [sessionId])

  // Wait for all steps to finish typing, then start the staged reveal sequence
  useEffect(() => {
    const nonSignal = thinkingSteps.filter((s) => !s.signals)
    if (analysisComplete && isThinking) {
      if (nonSignal.length === 0 || typingIndex >= nonSignal.length) {
        setIsThinking(false)
        // Stage 1: show extracted signals (immediately)
        setRevealStage('signals')
      }
    }
  }, [analysisComplete, isThinking, typingIndex, thinkingSteps])

  // Orchestrate the timed transitions between stages
  useEffect(() => {
    if (revealStage === 'signals') {
      revealTimerRef.current = setTimeout(() => setRevealStage('preparing'), 2000)
    } else if (revealStage === 'preparing') {
      revealTimerRef.current = setTimeout(() => {
        setRevealStage('ready')
        if (session?.status === 'awaiting_survey') {
          loadQuestions()
        }
      }, 4000)
    }
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current)
    }
  }, [revealStage, session])

  const handleAnswer = async (answer: string) => {
    if (!currentQuestion) return
    setChatHistory((prev) => [...prev, { role: 'user', content: answer }])
    try {
      const res = await fetch('/api/survey/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, question_id: currentQuestion.id, answer }),
      })
      if (!res.ok) {
        const err = await res.json()
        setChatHistory((prev) => [...prev, { role: 'agent', content: `Error: ${err.detail}` }])
        return
      }
      const data = await res.json()
      const newIndex = questionIndex + 1
      if (data.survey_complete || !data.next_question) {
        setSurveyComplete(true)
        setChatHistory((prev) => [...prev, { role: 'agent', content: 'All done! Generating your Agent Readiness score now...' }])
        await triggerScoring()
      } else {
        setCurrentQuestion(data.next_question)
        setQuestionIndex(newIndex)
        setQuestionHistory((prev) => [...prev, data.next_question])
        setChatHistory((prev) => [...prev, { role: 'agent', content: data.next_question.question, options: data.next_question.options }])
      }
    } catch {
      setChatHistory((prev) => [...prev, { role: 'agent', content: 'Something went wrong. Please try again.' }])
    }
  }

  const handleBack = () => {
    if (questionHistory.length < 2) return
    // Chat layout when on Q(n): [intro, Q1, ans1, Q2, ans2, ..., Q(n)]
    // Remove the last 2 entries: user's answer to Q(n-1) + Q(n)'s agent message
    setChatHistory((prev) => prev.slice(0, -2))
    const prevHistory = questionHistory.slice(0, -1)
    setQuestionHistory(prevHistory)
    setCurrentQuestion(prevHistory[prevHistory.length - 1])
    setQuestionIndex((prev) => prev - 1)
  }

  const triggerScoring = async () => {
    setIsScoring(true)
    try {
      const res = await fetch(`/api/score/${sessionId}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        setChatHistory((prev) => [...prev, { role: 'agent', content: `Could not start scoring: ${err.detail}` }])
        setIsScoring(false)
        return
      }
      let attempts = 0
      const poll = async () => {
        try {
          const sessionRes = await fetch(`/api/session/${sessionId}`)
          const sessionData = await sessionRes.json()
          if (sessionData.status === 'complete') {
            router.push(`/results/${sessionId}`)
          } else if (sessionData.status === 'error') {
            setIsScoring(false)
            setChatHistory((prev) => [...prev, { role: 'agent', content: `Scoring error: ${sessionData.error || 'Unknown error'}` }])
          } else if (attempts < 90) { attempts++; setTimeout(poll, 2000) }
          else {
            setIsScoring(false)
            setChatHistory((prev) => [...prev, { role: 'agent', content: 'Scoring is taking longer than expected. Please refresh and try again.' }])
          }
        } catch { if (attempts < 90) { attempts++; setTimeout(poll, 2000) } else setIsScoring(false) }
      }
      setTimeout(poll, 2000)
    } catch { setIsScoring(false) }
  }

  // Scoring activity steps — revealed one by one with typewriter animation
  const SCORING_STEPS = [
    'Collecting all extracted signals and survey responses...',
    'Evaluating AI Use Cases — mapping identified opportunities...',
    'Evaluating Data & Access — assessing data infrastructure readiness...',
    'Evaluating Workflows — reviewing process automation potential...',
    'Evaluating Technology — analyzing tech stack compatibility...',
    'Evaluating Team Readiness — gauging organizational preparedness...',
    'Evaluating Security & Compliance — checking governance policies...',
    'Computing weighted composite score across all dimensions...',
    'Generating personalized readiness report...',
  ]
  const [scoringStepIndex, setScoringStepIndex] = useState(0)
  const [scoringTypingDone, setScoringTypingDone] = useState(false)
  const scoringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isScoring) {
      setScoringStepIndex(0)
      setScoringTypingDone(false)
      return
    }
    if (scoringTypingDone && scoringStepIndex < SCORING_STEPS.length - 1) {
      const delay = 1200 + Math.random() * 800
      scoringTimerRef.current = setTimeout(() => {
        setScoringStepIndex(prev => prev + 1)
        setScoringTypingDone(false)
      }, delay)
    }
    return () => { if (scoringTimerRef.current) clearTimeout(scoringTimerRef.current) }
  }, [isScoring, scoringTypingDone, scoringStepIndex])

  const isError = thinkingSteps.some((s) => s.status === 'error') || session?.status === 'error'
  const extractedSignals = thinkingSteps.find((s) => s.signals)?.signals || null
  const nonSignalSteps = thinkingSteps.filter(s => !s.signals)
  const signalEntries = extractedSignals ? Object.entries(extractedSignals) : []
  // steps below this index have been seen before; only newly added ones animate
  const animatedFrom = animatedUpToRef.current - nonSignalSteps.length < 0 ? 0 : animatedUpToRef.current - nonSignalSteps.length

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }

  return (
    <div className="min-h-[calc(100vh-7rem)] max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="card-glass-lg rounded-2xl p-4 sm:p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="type-eyebrow text-muted-foreground">
                {phase === 'analyzing' ? 'PHASE 01 — CONTENT ANALYSIS' : phase === 'scoring' ? 'PHASE 03 — SCORING' : 'PHASE 02 — READINESS QUESTIONS'}
              </span>
              {(showLiveWorkspace || isScoring) && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide">
                  <Activity className="w-3 h-3" strokeWidth={2} />
                  LIVE
                </span>
              )}
            </div>
            <h1 className="type-subheadline text-lg sm:text-xl text-foreground">
              {phase === 'analyzing'
                ? 'Building your readiness profile'
                : phase === 'scoring'
                ? 'Scoring your organization'
                : 'Answer targeted readiness questions'}
            </h1>
          </div>
          {/* Assessment snapshot moved here from the right rail */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl card-inset">
              <div className="text-center">
                <p className="text-base font-semibold text-foreground leading-none">{signalEntries.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Signals</p>
              </div>
              <div className="w-px h-6 bg-border/60" />
              <div className="text-center">
                <p className="text-base font-semibold text-foreground leading-none">{totalQuestions || '—'}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Questions</p>
              </div>
              <div className="w-px h-6 bg-border/60" />
              <div className="text-center">
                <p className="text-base font-semibold text-foreground leading-none">
                  {phase === 'analyzing' ? '01' : phase === 'scoring' ? '03' : '02'}
                </p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1">Phase</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl card-inset">
              <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
              <span className="type-caption text-muted-foreground">Session {sessionId.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHASE 01: ANALYZING — full-width single card, no duplication ── */}
      {showLiveWorkspace && (
        <div className="card-glass-lg rounded-2xl overflow-hidden flex border border-border shadow-sm" style={{ minHeight: '520px' }}>

          {/* Left panel — thought stream */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
            <div className="px-6 py-4 border-b border-border/40 bg-white/40 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-foreground">Agent Activity</h2>
                <p className="text-[11px] text-muted-foreground truncate">Reading content, extracting signals, preparing your questions</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wide shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
              {nonSignalSteps.length === 0 ? (
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Connecting to agent...
                </div>
              ) : (
                nonSignalSteps.slice(0, typingIndex + 1).map((step, i) => {
                  const isTyping = i === typingIndex
                  // Complete means either this step finished typing, OR it's a previously seen step
                  const isComplete = i < typingIndex

                  return (
                    <div key={`${step.step}-${i}`} className="animate-fade-in-up flex items-start gap-4">
                      {/* Status dot / icon */}
                      <div className="shrink-0 mt-1 w-5 flex justify-center">
                        {step.status === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-500" strokeWidth={2} />
                        ) : isTyping ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                        )}
                      </div>

                      {/* Message */}
                      <p className={cn(
                        'flex-1 leading-relaxed',
                        step.status === 'error'
                          ? 'text-sm text-red-600'
                          : isTyping
                          ? 'text-base font-medium text-foreground'
                          : 'text-sm text-muted-foreground/80'
                      )}>
                        {isTyping ? (
                          <TypewriterText
                            text={step.message}
                            speed={35}
                            onComplete={() => setTypingIndex((prev) => Math.max(prev, i + 1))}
                          />
                        ) : (
                          step.message
                        )}
                      </p>
                    </div>
                  )
                })
              )}

              {isError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <p className="font-semibold">Error while analyzing</p>
                  <p className="mt-1 text-red-600">{session?.error || 'An error occurred'}</p>
                </div>
              )}

              <div ref={streamEndRef} />
            </div>
          </div>

          {/* Right panel — animated status visual */}
          <div className="w-[360px] shrink-0 flex flex-col items-center justify-center gap-8 bg-white/15 px-8 py-10">
            {/* Animated ring */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full bg-primary/5 scoring-pulse" />
              <div className="absolute w-32 h-32 rounded-full bg-primary/8 scoring-pulse-2" />
              <svg width="90" height="90" viewBox="0 0 120 120" className="scoring-ring">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary) / 0.12)" strokeWidth="5" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" strokeLinecap="round" className="scoring-ring-arc" style={{ transformOrigin: '60px 60px' }} />
              </svg>
              <div className="absolute w-12 h-12 rounded-full bg-white shadow-md border border-primary/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Status label */}
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {nonSignalSteps.length === 0
                  ? 'Initializing...'
                  : nonSignalSteps[nonSignalSteps.length - 1]?.status === 'in_progress'
                  ? 'Agent is working...'
                  : 'Wrapping up...'}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Extracting signals and building your readiness profile
              </p>
            </div>

            {/* Step progress dots (up to 4 THOUGHT lines) */}
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-500',
                    i < nonSignalSteps.length ? 'bg-primary scale-110' : 'bg-primary/20'
                  )}
                />
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-center">Usually takes 10–20 seconds</p>
          </div>
        </div>
      )}

      {/* ── PHASE 02 & 03: Staged reveal → then survey + scoring ── */}
      {!showLiveWorkspace && (
        <div className="space-y-5">

          {/* ── STAGE: "preparing" — loader card slides in above signals ── */}
          {revealStage === 'preparing' && (
            <section className="animate-slide-down-in card-glass-lg rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold text-lg text-foreground">Preparing your readiness assessment</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Some information is still missing. Generating targeted questions to fill in the gaps and build a complete picture of your AI readiness.
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
              {/* Shimmer progress bar */}
              <div className="mt-4 h-1.5 rounded-full bg-primary/10 relative overflow-hidden shimmer-bar">
                <div className="h-full bg-primary/25 rounded-full w-full" />
              </div>
            </section>
          )}

          {/* ── STAGE: "ready" — assessment card slides in above signals ── */}
          {revealStage === 'ready' && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.28fr),360px] gap-5 items-stretch animate-slide-down-in">
              <section className="min-w-0 h-full">
                <SurveyChat
                  chatHistory={chatHistory}
                  currentQuestion={currentQuestion}
                  onAnswer={handleAnswer}
                  onBack={handleBack}
                  canGoBack={questionHistory.length > 1}
                  surveyComplete={surveyComplete}
                  isScoring={isScoring}
                  questionIndex={questionIndex}
                  totalQuestions={totalQuestions}
                  sessionId={sessionId}
                />
              </section>

              <aside className="xl:sticky xl:top-20 h-full">
                <section className="card-glass-lg rounded-2xl overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 240px)', maxHeight: '520px' }}>
                  <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-white/40 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Agent Activity Feed</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {isScoring ? 'Generating final score' : 'Analysis complete'}
                        </p>
                      </div>
                    </div>
                    {isScoring && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        SCORING
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {!isScoring && nonSignalSteps.map((step, i) => (
                      <div key={i} className="rounded-xl card-inset p-2.5">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">
                            {(step.status === 'complete' || step.status === 'ready') && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />}
                            {step.status === 'error' && <XCircle className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />}
                          </div>
                          <p className={cn('text-[11px] leading-relaxed', step.status === 'error' ? 'text-red-700' : 'text-muted-foreground')}>
                            {step.message}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isScoring && (
                      <>
                        {SCORING_STEPS.slice(0, scoringStepIndex + 1).map((stepMsg, i) => {
                          const isCurrentStep = i === scoringStepIndex
                          const isDone = i < scoringStepIndex

                          return (
                            <div key={i} className="rounded-xl card-inset p-2.5 flex items-start gap-2 animate-fade-in-up">
                              <div className="mt-0.5 shrink-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                                ) : (
                                  <div className="w-3.5 h-3.5 mt-px flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  </div>
                                )}
                              </div>
                              <p className={cn(
                                'text-[11px] leading-relaxed',
                                isDone ? 'text-muted-foreground/70' : 'text-foreground font-medium'
                              )}>
                                {isCurrentStep ? (
                                  <TypewriterText
                                    text={stepMsg}
                                    speed={25}
                                    onComplete={() => setScoringTypingDone(true)}
                                  />
                                ) : (
                                  stepMsg
                                )}
                              </p>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          )}

          {/* ── Extracted Signals card — always visible once analysis is done ── */}
          {signalEntries.length > 0 && revealStage !== 'none' && (
            <section className={cn(
              'card-glass-lg rounded-2xl p-4 sm:p-5 transition-all duration-700 ease-out',
              revealStage === 'signals' ? 'animate-fade-in' : ''
            )}>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                <div>
                  <p className="type-eyebrow text-muted-foreground">Extracted Signals</p>
                  <h2 className="type-subheadline text-xl sm:text-2xl text-foreground mt-1">What we understood from your website</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  {signalEntries.length} dimensions detected from your source material
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {signalEntries.map(([key, value]) => {
                  const Icon = SIGNAL_ICONS[key] || Globe
                  const isArray = Array.isArray(value)

                  return (
                    <div key={key} className="rounded-2xl card-inset p-4">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{key}</span>
                        </div>
                      </div>

                      {isArray ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(value as string[]).map((item, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg text-[11px] text-foreground bg-primary/5 border border-primary/15">
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-foreground leading-relaxed">{value as string}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
