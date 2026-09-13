import { LanguageSlice } from '../types/player'

const PALETTE = ['#00D9A3', '#F0B23D', '#5B8DEF', '#E8615A', '#B58AF0', '#4ADEDE', '#F0DE3D', '#7C8A99']

interface Props {
  languages: LanguageSlice[]
}

export default function LanguageChart({ languages }: Props) {
  if (languages.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-lg p-5">
        <h3 className="font-display font-semibold text-base mb-2">Languages</h3>
        <p className="text-muted text-sm">No language data available yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <h3 className="font-display font-semibold text-base mb-4">Languages</h3>
      <div className="space-y-3">
        {languages.map((lang, i) => (
          <div key={lang.language}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink_text">{lang.language}</span>
              <span className="font-mono text-muted">{lang.percent.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-raised rounded-full overflow-hidden">
              <div
                className="h-full rounded-full animate-fill-bar"
                style={{ width: `${lang.percent}%`, backgroundColor: PALETTE[i % PALETTE.length] }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
