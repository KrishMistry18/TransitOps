import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#11151C',
        surface: '#1B212B',
        'surface-raised': '#232A35',
        border: '#2B333F',
        'text-primary': '#EDEFF2',
        'text-muted': '#8A93A3',
        'accent-primary': '#5B8DEF',
        'accent-primary-hover': '#4877D4',
        'status-available': '#4CAF7D',
        'status-pending': '#E8A23D',
        'status-inshop': '#8A93A3',
        'status-danger': '#E0575B',
        // Module Accents
        'mod-dashboard': '#5B8DEF',
        'mod-fleet': '#5B8DEF',
        'mod-drivers': '#E8A23D',
        'mod-trips': '#4CAF7D',
        'mod-maintenance': '#8A93A3',
        'mod-finance': '#C97BE4',
        'mod-analytics': '#5FD0D9',
        'mod-settings': '#8A93A3',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'modal': '0 8px 24px rgba(0,0,0,0.35)',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
      }
    },
  },
  plugins: [],
} satisfies Config
