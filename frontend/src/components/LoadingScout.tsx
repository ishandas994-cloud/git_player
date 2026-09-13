import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  'Analyzing repositories…',
  'Analyzing contributions…',
  'Analyzing commits…',
  'Analyzing technical profile…',
  'Calculating rating…',
  'Generating player card…',
]

export default function LoadingScout() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1))
    }, 900)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="w-16 h-16 rounded-full border-2 border-line border-t-signal animate-spin" />
      <div className="text-center">
        <div className="font-display font-semibold text-sm tracking-wide text-signal mb-2">
          SCOUTING PLAYER
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-muted font-mono text-sm"
          >
            {STAGES[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
