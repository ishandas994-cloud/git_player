import { Info } from 'lucide-react'

interface Props {
  text: string
}

export default function Disclaimer({ text }: Props) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted bg-surface/60 border border-line rounded-md px-3 py-2.5">
      <Info size={14} className="shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  )
}
