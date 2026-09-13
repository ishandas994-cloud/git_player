import { Routes, Route, Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import Home from './pages/Home'
import PlayerPage from './pages/PlayerPage'
import ComparePage from './pages/ComparePage'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Github size={20} className="text-signal" />
            <span className="font-display font-semibold text-sm tracking-tight text-ink_text group-hover:text-signal transition-colors">
              GitHub Player Rating
            </span>
          </Link>
          <nav className="text-sm text-muted">
            <span className="hidden sm:inline">Analyze • Rate • Compare</span>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:username" element={<PlayerPage />} />
          <Route path="/compare/:a/:b" element={<ComparePage />} />
        </Routes>
      </main>

      <footer className="border-t border-line py-6">
        <div className="max-w-6xl mx-auto px-6 text-xs text-muted">
          GitHub Player Rating is an independent scoring system based on publicly available GitHub
          data. Not affiliated with GitHub.
        </div>
      </footer>
    </div>
  )
}
