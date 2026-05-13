/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#030303',
        card: 'rgba(18,18,18,0.85)',
        border: 'rgba(255,255,255,0.08)',
        accent: '#fbbf24',
        'accent-glow': 'rgba(251,191,36,0.4)',
        text: '#fff',
        muted: '#a1a1aa',
        danger: '#ef4444',
        success: '#22c55e',
        info: '#3b82f6',
        warning: '#f59e0b',
        purple: '#a78bfa',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      }
    }
  }
}
