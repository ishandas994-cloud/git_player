import type { ReactNode } from 'react'
import { ActivityInfo } from '../types/player'
import { Flame, CalendarDays, Activity as ActivityIcon } from 'lucide-react'

interface Props {
  activity: ActivityInfo
}

export default function ActivityGraph({ activity }: Props) {
  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-base">Activity</h3>
        {activity.isEstimate && (
          <span className="text-[10px] text-muted font-mono">estimated from public events</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<CalendarDays size={16} />} label="Active days (90d)" value={activity.activeDaysLast90} />
        <Tile icon={<Flame size={16} />} label="Current streak" value={`${activity.currentStreak}d`} />
        <Tile icon={<ActivityIcon size={16} />} label="Longest streak" value={`${activity.longestStreak}d`} />
      </div>
      <div className="mt-3 pt-3 border-t border-line flex justify-between text-sm">
        <span className="text-muted">Contributions (last year)</span>
        <span className="font-mono font-semibold">{activity.contributionsLastYear}</span>
      </div>
    </div>
  )
}

function Tile({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-raised rounded-md p-3 flex flex-col gap-1">
      <div className="text-signal">{icon}</div>
      <div className="font-mono text-lg font-semibold">{value}</div>
      <div className="text-[10px] text-muted leading-tight">{label}</div>
    </div>
  )
}
