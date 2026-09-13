import { CompareResult } from '../types/player'
import PlayerCard from './PlayerCard'

interface Props {
  data: CompareResult
}

const ATTR_LABELS: { key: keyof CompareResult['playerA']['attributes']; label: string }[] = [
  { key: 'pac', label: 'PAC' },
  { key: 'sho', label: 'SHO' },
  { key: 'pas', label: 'PAS' },
  { key: 'dri', label: 'DRI' },
  { key: 'def', label: 'DEF' },
  { key: 'phy', label: 'PHY' },
]

export default function CompareView({ data }: Props) {
  const { playerA, playerB } = data

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="font-display font-semibold text-xl">{data.summary}</div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        <PlayerCard player={playerA} size="compact" />

        <div className="w-full max-w-md space-y-3">
          {ATTR_LABELS.map(({ key, label }) => {
            const a = playerA.attributes[key]
            const b = playerB.attributes[key]
            const total = a + b || 1
            return (
              <div key={key}>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className={a >= b ? 'text-signal font-semibold' : 'text-muted'}>{a}</span>
                  <span className="text-muted">{label}</span>
                  <span className={b >= a ? 'text-gold font-semibold' : 'text-muted'}>{b}</span>
                </div>
                <div className="h-1.5 bg-raised rounded-full overflow-hidden flex">
                  <div className="h-full bg-signal" style={{ width: `${(a / total) * 100}%` }} />
                  <div className="h-full bg-gold" style={{ width: `${(b / total) * 100}%` }} />
                </div>
              </div>
            )
          })}

          <div className="flex justify-between text-sm font-mono pt-3 border-t border-line mt-4">
            <span className="text-signal font-semibold">{data.scoreA} won</span>
            <span className="text-muted">categories</span>
            <span className="text-gold font-semibold">{data.scoreB} won</span>
          </div>
        </div>

        <PlayerCard player={playerB} size="compact" />
      </div>
    </div>
  )
}
