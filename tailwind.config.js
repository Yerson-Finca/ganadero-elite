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
  card: '#0F0F0F',
  border: '#1A1A1A',
  accent: '#4FD1C5',
  'accent-glow': 'rgba(79, 209, 197, 0.15)',
  success: '#4FD1C5',
  danger: '#FF6B6B',
  warning: '#F59E0B',
  info: '#60A5FA',
  ia: '#7C3AED',
  'ia-glow': 'rgba(124, 58, 237, 0.15)',
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
        'h2': ['18px', { fontWeight: '700', lineHeight: '1.2' }],
        'h3': ['15px', { fontWeight: '600', lineHeight: '1.2' }],
        'val': ['20px', { fontWeight: '800', lineHeight: '1.1' }],
        'label': ['13px', { fontWeight: '400' }],
        'muted': ['11px', { fontWeight: '400' }],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.3)',
        'accent': '0 0 20px rgba(0, 212, 170, 0.2)',
        'ia': '0 0 15px rgba(139, 92, 246, 0.1), 0 0 30px rgba(139, 92, 246, 0.05)',
        'btn-add': '0 0 25px rgba(0, 212, 170, 0.3), 0 0 50px rgba(0, 212, 170, 0.1)',
      },
    }
  },
  plugins: []
}
