/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        card: '#111111',
        border: '#1A1A1A',
        accent: '#F5C842',
        'accent-glow': 'rgba(245,200,66,0.15)',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#60A5FA',
        text: {
          primary: '#F5F5F5',
          secondary: '#888888',
          muted: '#555555'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'card': '2px 2px 0px rgba(0,0,0,0.5)',
        'accent': '2px 2px 0px rgba(245,200,66,0.3)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease',
        'slide-down': 'slideDown 0.3s ease',
        'fade-in': 'fadeIn 0.2s ease'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
