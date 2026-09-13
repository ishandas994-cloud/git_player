import { Insights as InsightsType } from '../types/player'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  insights: InsightsType
}

export default function Insights({ insights }: Props) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="bg-surface border border-line rounded-lg p-5">
        <h3 className="font-display font-semibold text-base mb-3 text-signal">Strengths</h3>
        <ul className="space-y-2.5">
          {insights.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink_text">
              <CheckCircle2 size={16} className="text-signal shrink-0 mt-0.5" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface border border-line rounded-lg p-5">
        <h3 className="font-display font-semibold text-base mb-3 text-gold">Areas to improve</h3>
        <ul className="space-y-2.5">
          {insights.weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-ink_text">
              <AlertCircle size={16} className="text-gold shrink-0 mt-0.5" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
