import { useState, FormEvent } from 'react'
import { Search } from 'lucide-react'

interface Props {
  onSubmit: (username: string) => void
  loading?: boolean
  placeholder?: string
  compact?: boolean
}

export default function SearchBar({ onSubmit, loading, placeholder, compact }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim().replace(/^@/, '')
    if (trimmed) onSubmit(trimmed)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2 bg-surface border border-line rounded-md px-4 focus-within:border-signal transition-colors ${
        compact ? 'py-2' : 'py-3'
      }`}
    >
      <span className="text-muted font-mono text-sm select-none">github.com/</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'ishandas994-cloud'}
        className="flex-1 bg-transparent outline-none font-mono text-sm text-ink_text placeholder:text-muted/60"
        aria-label="GitHub username"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 bg-signal text-ink font-medium text-sm px-3 py-1.5 rounded disabled:opacity-50 hover:bg-signal-dim transition-colors"
      >
        <Search size={14} />
        {loading ? 'Scouting…' : 'Rate'}
      </button>
    </form>
  )
}
