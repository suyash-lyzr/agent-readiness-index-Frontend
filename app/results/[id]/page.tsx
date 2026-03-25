'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ResultsDashboard from '@/components/ResultsDashboard'

interface ScoreData {
  overall_score: number
  tier: string
  pillar_scores: Record<string, any>
  top_strengths: string[]
  critical_gaps: string[]
  transparency: any
}

export default function ResultsPage() {
  const params = useParams()
  const sessionId = params.id as string
  const router = useRouter()

  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (!res.ok) {
          setError('Session not found')
          setLoading(false)
          return
        }
        const data = await res.json()

        if (data.status === 'complete' && data.score_data) {
          setScoreData(data.score_data)
          setLoading(false)
        } else if (data.status === 'error') {
          setError(data.error || 'An error occurred during scoring')
          setLoading(false)
        } else if (data.status === 'scoring' || data.status === 'awaiting_survey') {
          // Still processing, poll again
          if (pollCount < 30) {
            setPollCount((c) => c + 1)
            setTimeout(fetchResults, 2000)
          } else {
            setError('Scoring is taking too long. Please try again.')
            setLoading(false)
          }
        } else {
          // Redirect to survey if not scored yet
          router.push(`/survey/${sessionId}`)
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load results')
        setLoading(false)
      }
    }

    fetchResults()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-cyan-500 border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Generating Your Score</h2>
            <p className="text-slate-400">Claude is synthesizing all signals and survey responses...</p>
            <p className="text-slate-500 text-sm mt-2">This typically takes 15–30 seconds</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            {['Analyzing signals', 'Scoring pillars', 'Writing insights', 'Finalizing report'].map((step, i) => (
              <div
                key={step}
                className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors"
            >
              Start Over
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors border border-slate-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!scoreData) return null

  return <ResultsDashboard sessionId={sessionId} scoreData={scoreData} />
}
