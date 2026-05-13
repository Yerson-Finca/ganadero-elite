/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#1A1A1A',
        card: '#242424',
        border: '#333333',
        accent: '#fdcc0d',
        'accent-light': 'rgba(201,169,110,0.12)',
        success: '#4CAF50',
        'success-light': 'rgba(91,154,107,0.12)',
        danger: '#E0554A',
        'danger-light': 'rgba(201,112,101,0.12)',
        warning: '#D4A853',
        'warning-light': 'rgba(212,168,83,0.12)',
        info: '#7BA4C9',
        ia: '#9B8EC4',
        'ia-light': 'rgba(155,142,196,0.12)',
        text: { primary: '#F5F5F5', secondary: '#AAAAAA', muted: '#777777' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { '2xl': '18px', '3xl': '22px' }
    }
  },
  plugins: []
}
