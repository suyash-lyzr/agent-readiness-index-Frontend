'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface PillarScore {
  score: number
  weight: number
  weighted_score: number
}

interface Props {
  pillarScores: Record<string, PillarScore>
}

const PILLAR_LABELS: Record<string, string> = {
  use_case_clarity: 'AI Use Cases',
  data_readiness: 'Data & Access',
  process_readiness: 'Workflows',
  tech_infrastructure: 'Technology',
  people_culture: 'Team',
  governance_compliance: 'Security',
}

const PILLAR_ORDER = [
  'use_case_clarity',
  'data_readiness',
  'process_readiness',
  'tech_infrastructure',
  'people_culture',
  'governance_compliance',
]

export default function PillarRadarChart({ pillarScores }: Props) {
  const data = PILLAR_ORDER.map((key) => ({
    pillar: PILLAR_LABELS[key],
    score: pillarScores[key]?.score ?? 0,
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={data}>
        <PolarGrid stroke="hsl(30 10% 80%)" strokeDasharray="4 4" />
        <PolarAngleAxis
          dataKey="pillar"
          tick={{ fill: 'hsl(30 20% 30%)', fontSize: 13, fontWeight: 600 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: 'hsl(30 10% 60%)', fontSize: 10, fontWeight: 500 }}
          tickCount={5}
          axisLine={false}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="hsl(26 35% 35%)"
          fill="hsl(26 35% 35%)"
          fillOpacity={0.25}
          strokeWidth={3}
          dot={{ r: 4, fill: 'hsl(26 35% 35%)', strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
