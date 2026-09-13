import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { fetchComparison, ApiError } from '../api/client'
import { CompareResult } from '../types/player'
import LoadingScout from '../components/LoadingScout'
import CompareView from '../components/CompareView'
import Disclaimer from '../components/Disclaimer'

export default function ComparePage() {
  const { a, b } = useParams<{ a: string; b: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<CompareResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!a || !b) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setData(null)

    fetchComparison(a, b, controller.signal)
      .then(setData)
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [a, b])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6">
        <LoadingScout />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <AlertTriangle className="mx-auto mb-4 text-gold" size={32} />
        <h2 className="font-display font-semibold text-lg mb-2">Couldn't compare these players</h2>
        <p className="text-muted text-sm mb-6">{error ?? 'Unknown error.'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-signal text-sm hover:underline underline-offset-2"
        >
          Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <CompareView data={data} />
      <Disclaimer text={data.playerA.disclaimer} />
    </div>
  )
}
