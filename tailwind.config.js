/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        umbra: {
          bg: '#0a0b14',
          surface: '#111225',
          card: '#181930',
          border: '#252640',
          purple: '#7c3aed',
          'purple-light': '#a855f7',
          teal: '#06b6d4',
          'teal-light': '#22d3ee',
          text: '#e2e4f0',
          muted: '#8890b8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-umbra': 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)',
      },
    },
  },
  plugins: [],
}
