import { useCallback, useState, type ReactNode, type RefObject } from 'react'
import { toPng } from 'html-to-image'
import { Check, Download, Facebook, Instagram, Link as LinkIcon, Linkedin, MessageCircle, Share2 } from 'lucide-react'
import type { PlayerResult } from '../types/player'

interface Props {
  player: PlayerResult
  cardRef: RefObject<HTMLDivElement>
}

function buildShareUrl(player: PlayerResult): string {
  return `${window.location.origin}/player/${player.username}`
}

function buildShareText(player: PlayerResult): string {
  return `I just rated ${player.ovr} OVR (${player.tier}) as a ${player.position.code} on GitHub Player Rating`
}

/** Rasterizes the card DOM node into a PNG blob, at 2x for a crisp download/share image. */
async function captureCardImage(node: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
  const res = await fetch(dataUrl)
  return res.blob()
}

export default function ShareCard({ player, cardRef }: Props) {
  const [busy, setBusy] = useState<'download' | 'share' | null>(null)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const url = buildShareUrl(player)
  const text = buildShareText(player)
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const download = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('download')
    setNote(null)
    try {
      const blob = await captureCardImage(cardRef.current)
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `${player.username}-player-card.png`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('card image export failed:', err)
      setNote("Couldn't generate the image — try again, or take a screenshot instead.")
    } finally {
      setBusy(null)
    }
  }, [cardRef, player.username])

  /**
   * Used for the native Share button AND the Instagram button, since Instagram has no
   * web share-intent URL — the OS share sheet (which lists Instagram, WhatsApp, etc.)
   * is the only way to hand it a pre-made image from a website.
   */
  const nativeShare = useCallback(async () => {
    setBusy('share')
    setNote(null)
    try {
      if (!canNativeShare) throw new Error('unsupported')

      let shareData: ShareData = { title: 'GitHub Player Rating', text, url }

      if (cardRef.current) {
        const blob = await captureCardImage(cardRef.current)
        const file = new File([blob], `${player.username}-player-card.png`, { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          shareData = { ...shareData, files: [file] }
        }
      }

      await navigator.share(shareData)
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return // user closed the share sheet — not an error
      await download()
      setNote(canNativeShare
        ? 'Sharing was cancelled or failed — the card image downloaded instead, so you can attach it manually.'
        : "This browser doesn't support direct sharing — the card image downloaded instead.")
    } finally {
      setBusy(null)
    }
  }, [canNativeShare, cardRef, download, player.username, text, url])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setNote('Could not copy automatically — copy the link from your address bar instead.')
    }
  }, [url])

  function openIntent(href: string) {
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=640')
  }

  const intents = {
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  }

  return (
    <div className="bg-surface border border-line rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-display font-semibold text-base">Share your card</h3>
        {canNativeShare && (
          <button
            onClick={nativeShare}
            disabled={busy !== null}
            className="flex items-center gap-1.5 text-xs text-signal hover:underline underline-offset-2 disabled:opacity-50"
          >
            <Share2 size={14} />
            {busy === 'share' ? 'Sharing…' : 'Share'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <IconButton label="X" icon={<XLogo />} onClick={() => openIntent(intents.x)} />
        <IconButton label="WhatsApp" icon={<MessageCircle size={16} />} onClick={() => openIntent(intents.whatsapp)} />
        <IconButton label="Facebook" icon={<Facebook size={16} />} onClick={() => openIntent(intents.facebook)} />
        <IconButton label="LinkedIn" icon={<Linkedin size={16} />} onClick={() => openIntent(intents.linkedin)} />
        <IconButton label="Instagram" icon={<Instagram size={16} />} onClick={nativeShare} disabled={busy !== null} />
        <IconButton
          label={copied ? 'Copied' : 'Copy link'}
          icon={copied ? <Check size={16} /> : <LinkIcon size={16} />}
          onClick={copyLink}
        />
        <IconButton
          label={busy === 'download' ? 'Saving…' : 'Download image'}
          icon={<Download size={16} />}
          onClick={download}
          disabled={busy !== null}
        />
      </div>

      {note && <p className="text-xs text-muted mt-3">{note}</p>}
      <p className="text-[10px] text-muted mt-3 leading-relaxed">
        Instagram doesn't support pre-filled web posts — the Instagram button opens your
        device's share sheet (or downloads the card image) so you can post it from there.
      </p>
    </div>
  )
}

function IconButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 bg-raised hover:bg-raised/70 border border-line rounded-md px-3 py-1.5 text-xs text-ink_text disabled:opacity-50 transition-colors"
    >
      {icon}
      {label}
    </button>
  )
}

function XLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}