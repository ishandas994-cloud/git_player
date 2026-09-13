import { PlayerResult } from '../types/player'

interface Props {
  player: PlayerResult
  size?: 'default' | 'compact'
}

const tierAccent: Record<string, string> = {
  'Legendary Developer': 'gold',
  'Elite Developer': 'gold',
  'Advanced Developer': 'signal',
  'Solid Developer': 'signal',
  'Developing Developer': 'signal',
  'Beginner Developer': 'muted',
  'Rookie Developer': 'muted',
}

export default function PlayerCard({ player, size = 'default' }: Props) {
  const accent = tierAccent[player.tier] ?? 'signal'
  const isGold = accent === 'gold'
  const width = size === 'compact' ? 'w-64' : 'w-80'

  return (
    <div
      className={`animate-card-reveal ${width} aspect-[3/4] relative shrink-0`}
      style={{ clipPath: 'polygon(6% 0, 100% 0, 100% 94%, 94% 100%, 0 100%, 0 6%)' }}
    >
      <div
        className={`absolute inset-0 ${
          isGold
            ? 'bg-gradient-to-b from-[#2A2410] via-[#171A12] to-[#0A0E14]'
            : 'bg-gradient-to-b from-[#0F2A24] via-[#12181F] to-[#0A0E14]'
        } border ${isGold ? 'border-gold/50' : 'border-signal/40'} ${
          isGold ? 'shadow-goldglow' : 'shadow-glow'
        }`}
        style={{ clipPath: 'polygon(6% 0, 100% 0, 100% 94%, 94% 100%, 0 100%, 0 6%)' }}
      >
        <div className="flex flex-col h-full p-5">
          {/* Top: OVR + position + tier badge */}
          <div className="flex items-start justify-between">
            <div className="font-mono leading-none">
              <div className={`text-4xl font-bold ${isGold ? 'text-gold' : 'text-signal'}`}>
                {player.ovr}
              </div>
              <div className="text-xs text-muted mt-1 tracking-wide">{player.position.code}</div>
            </div>
            <div
              className={`text-[10px] font-mono px-2 py-1 rounded border ${
                isGold ? 'border-gold/40 text-gold' : 'border-signal/40 text-signal'
              }`}
            >
              {player.tier.replace(' Developer', '')}
            </div>
          </div>

          {/* Avatar */}
          <div className="flex-1 flex items-center justify-center py-2">
            <img
              src={player.avatarUrl}
              alt={player.username}
              className="w-28 h-28 rounded-full object-cover border-2 border-white/10"
            />
          </div>

          {/* Name */}
          <div className="text-center mb-3">
            <div className="font-display font-semibold text-lg tracking-tight truncate">
              {player.displayName.toUpperCase()}
            </div>
            <div className="text-xs text-muted font-mono truncate">@{player.username}</div>
          </div>

          {/* Attributes grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-sm border-t border-white/10 pt-3">
            <Stat label="PAC" value={player.attributes.pac} />
            <Stat label="DRI" value={player.attributes.dri} />
            <Stat label="SHO" value={player.attributes.sho} />
            <Stat label="DEF" value={player.attributes.def} />
            <Stat label="PAS" value={player.attributes.pas} />
            <Stat label="PHY" value={player.attributes.phy} />
          </div>

          {/* Footer stats */}
          <div className="flex justify-between text-[10px] text-muted font-mono mt-3 pt-2 border-t border-white/10">
            <span>★ {player.overview.stars}</span>
            <span>{player.overview.followers} followers</span>
            <span>{player.overview.repositories} repos</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-ink_text w-6 text-right">{value}</span>
      <span className="text-muted text-xs tracking-wide">{label}</span>
    </div>
  )
}
