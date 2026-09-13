import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SearchBar from '../components/SearchBar'
import PlayerCard from '../components/PlayerCard'
import { PlayerResult } from '../types/player'

const EXAMPLE_CARD: PlayerResult = {
  username: 'octodev',
  displayName: 'Octo Dev',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  bio: '',
  location: '',
  profileUrl: '',
  ovr: 84,
  tier: 'Elite Developer',
  position: { code: 'CAM', name: 'Attacking Midfielder', reason: '' },
  attributes: { pac: 84, sho: 78, pas: 82, dri: 91, def: 76, phy: 88 },
  breakdown: [],
  insights: { strengths: [], weaknesses: [] },
  overview: {
    repositories: 34,
    stars: 1200,
    followers: 340,
    following: 60,
    forks: 90,
    recentCommits: 0,
    pullRequests: 0,
    issues: 0,
  },
  activity: { activeDaysLast90: 0, currentStreak: 0, longestStreak: 0, contributionsLastYear: 0, isEstimate: true },
  languages: [],
  topRepos: [],
  disclaimer: '',
}

const FEATURES = [
  { title: 'Profile & repo metrics', desc: 'Followers, stars, forks, docs, topics, releases and more.' },
  { title: 'Real coding activity', desc: 'Commit frequency, streaks and consistency — not just commit count.' },
  { title: 'Six football attributes', desc: 'PAC, SHO, PAS, DRI, DEF and PHY, mapped from your actual GitHub data.' },
  { title: 'Transparent scoring', desc: 'Every point is explainable — see exactly how your OVR was calculated.' },
]

export default function Home() {
  const navigate = useNavigate()
  const [compareA, setCompareA] = useState('')
  const [compareB, setCompareB] = useState('')

  function handleSearch(username: string) {
    navigate(`/player/${encodeURIComponent(username)}`)
  }

  function handleCompare(e: FormEvent) {
    e.preventDefault()
    const a = compareA.trim().replace(/^@/, '')
    const b = compareB.trim().replace(/^@/, '')
    if (a && b) navigate(`/compare/${encodeURIComponent(a)}/${encodeURIComponent(b)}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="dot-field border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-signal font-mono text-xs tracking-wide mb-4">GITHUB PLAYER RATING</div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.1] mb-5">
              Turn your commits into a football player.
            </h1>
            <p className="text-muted mb-8 max-w-md">
              Your GitHub profile is your career. Enter a username and we'll calculate your rating.
            </p>
            <SearchBar onSubmit={handleSearch} />

            <form onSubmit={handleCompare} className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Or compare</span>
              <input
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                placeholder="userA"
                className="bg-surface border border-line rounded px-2.5 py-1.5 font-mono text-xs w-28 outline-none focus:border-signal"
              />
              <span className="text-muted">vs</span>
              <input
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                placeholder="userB"
                className="bg-surface border border-line rounded px-2.5 py-1.5 font-mono text-xs w-28 outline-none focus:border-signal"
              />
              <button
                type="submit"
                className="text-signal font-medium px-2 py-1.5 hover:underline underline-offset-2"
              >
                Compare
              </button>
            </form>
          </div>

          <motion.div
            initial={{ opacity: 0, rotate: -6, y: 30 }}
            animate={{ opacity: 1, rotate: -4, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <PlayerCard player={EXAMPLE_CARD} />
          </motion.div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-surface border border-line rounded-lg p-5">
              <h3 className="font-display font-semibold text-sm mb-2">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
