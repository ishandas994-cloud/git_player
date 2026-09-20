import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { fetchPlayer, ApiError } from '../api/client'
import { PlayerResult } from '../types/player'
import PlayerCard from '../components/PlayerCard'
import LoadingScout from '../components/LoadingScout'
import ScoreBreakdown from '../components/ScoreBreakdown'
import AttributeRadar from '../components/AttributeRadar'
import ActivityGraph from '../components/ActivityGraph'
import LanguageChart from '../components/LanguageChart'
import TopRepos from '../components/TopRepos'
import Insights from '../components/Insights'
import Disclaimer from '../components/Disclaimer'
import SearchBar from '../components/SearchBar'
import ShareCard from '../components/ShareCard'

export default function PlayerPage() {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const [player, setPlayer] = useState<PlayerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!username) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setPlayer(null)

    fetchPlayer(username, controller.signal)
      .then(setPlayer)
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [username])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <LoadingScout />
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <AlertTriangle className="mx-auto mb-4 text-gold" size={32} />
        <h2 className="font-display font-semibold text-lg mb-2">Couldn't rate this player</h2>
        <p className="text-muted text-sm mb-6">{error ?? 'Unknown error.'}</p>
        <div className="max-w-xs mx-auto">
          <SearchBar onSubmit={(u) => navigate(`/player/${encodeURIComponent(u)}`)} compact />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex flex-col items-center lg:items-stretch gap-4">
          <div ref={cardRef} className="inline-block">
            <PlayerCard player={player} />
          </div>
          <ShareCard player={player} cardRef={cardRef} />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h1 className="font-display font-bold text-2xl">{player.displayName}</h1>
            {player.bio && <p className="text-muted text-sm mt-1">{player.bio}</p>}
            <p className="text-xs text-muted mt-1 font-mono">{player.position.reason}</p>
          </div>
          <ScoreBreakdown breakdown={player.breakdown} ovr={player.ovr} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-line rounded-lg p-5">
          <h3 className="font-display font-semibold text-base mb-2">Attribute profile</h3>
          <AttributeRadar attributes={player.attributes} />
        </div>
        <ActivityGraph activity={player.activity} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <LanguageChart languages={player.languages} />
        <TopRepos repos={player.topRepos} />
      </div>

      <Insights insights={player.insights} />

      <Disclaimer text={player.disclaimer} />
    </div>
  )
}