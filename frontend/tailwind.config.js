/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        signal: '#00D9A3',
        'signal-dim': '#00B789',
        gold: '#F0B23D',
        line: '#232B36',
        surface: '#111821',
        raised: '#1A2430',
        ink: '#0A0E14',
        ink_text: '#E6EDF3',
        muted: '#7C8A99',
      },
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 32px rgba(0, 217, 163, 0.18)',
        goldglow: '0 0 32px rgba(240, 178, 61, 0.18)',
      },
    },
  },
  plugins: [],
}
