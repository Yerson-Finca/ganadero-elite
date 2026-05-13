/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#000000',
        card: '#0A0A0A',
        border: '#1A1A1A',
        accent: '#FDCC0D',
        'accent-glow': 'rgba(253, 204, 13, 0.08)',
        success: '#FDCC0D',
        danger: '#FF6B6B',
        warning: '#F59E0B',
        info: '#60A5FA',
        ia: '#7C3AED',
        'ia-glow': 'rgba(124, 58, 237, 0.08)',
        text: {
          primary: '#FFFFFF',
          secondary: '#A0AEC0',
          muted: '#4A5568',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'h1': ['28px', { fontWeight: '900', lineHeight: '1.15' }],
        'h2': ['16px', { fontWeight: '700', lineHeight: '1.2' }],
        'h3': ['14px', { fontWeight: '600', lineHeight: '1.2' }],
        'val': ['20px', { fontWeight: '800', lineHeight: '1.1' }],
        'label': ['13px', { fontWeight: '400' }],
        'muted': ['11px', { fontWeight: '400' }],
      },
    }
  },
  plugins: []
}
}
