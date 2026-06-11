import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-card': '#141414',
        'bg-card-hover': '#1a1a1a',
        border: '#1f1f1f',
        'text-primary': '#f5f5f5',
        'text-secondary': '#737373',
        'accent-green': '#22c55e',
        'accent-red': '#ef4444',
        'accent-blue': '#3b82f6',
        'accent-yellow': '#f59e0b',
        'accent-purple': '#8b5cf6',
      },
    },
  },
  plugins: [],
}
export default config
