import { BreakdownItem } from '../types/player'

interface Props {
  breakdown: BreakdownItem[]
  ovr: number
}

export default function ScoreBreakdown({ breakdown, ovr }: Props) {
  const total = breakdown.reduce((sum, b) => sum + b.score, 0)

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-base">Score breakdown</h3>
        <span className="font-mono text-2xl font-bold text-signal">{ovr}</span>
      </div>

      <div className="space-y-3">
        {breakdown.map((item) => (
          <div key={item.category}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink_text">{item.category}</span>
              <span className="font-mono text-muted">
                {item.score.toFixed(1)}/{item.max.toFixed(0)}
              </span>
            </div>
            <div className="h-1.5 bg-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-signal rounded-full animate-fill-bar"
                style={{ width: `${(item.score / item.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm font-mono mt-4 pt-3 border-t border-line">
        <span className="text-muted">TOTAL</span>
        <span className="font-semibold">{total.toFixed(1)}/100</span>
      </div>
    </div>
  )
}
