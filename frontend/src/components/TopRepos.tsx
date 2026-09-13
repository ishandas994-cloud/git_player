import { RepoSummary } from '../types/player'
import { Star, GitFork } from 'lucide-react'

interface Props {
  repos: RepoSummary[]
}

export default function TopRepos({ repos }: Props) {
  if (repos.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-lg p-5">
        <h3 className="font-display font-semibold text-base mb-2">Repository performance</h3>
        <p className="text-muted text-sm">No original repositories found yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <h3 className="font-display font-semibold text-base mb-4">Repository performance</h3>
      <div className="space-y-2">
        {repos.map((repo) => (
          <a
            key={repo.name}
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between bg-raised hover:bg-raised/70 rounded-md px-3 py-2.5 transition-colors group"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-ink_text group-hover:text-signal transition-colors truncate">
                {repo.name}
              </div>
              {repo.description && (
                <div className="text-xs text-muted truncate max-w-xs">{repo.description}</div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted font-mono shrink-0 ml-3">
              {repo.language && <span className="hidden sm:inline">{repo.language}</span>}
              <span className="flex items-center gap-1">
                <Star size={12} /> {repo.stars}
              </span>
              <span className="flex items-center gap-1">
                <GitFork size={12} /> {repo.forks}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
