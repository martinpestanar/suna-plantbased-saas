/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4332',
          dark: '#123024',
        },
        secondary: {
          DEFAULT: '#40916C',
        },
        accent: {
          DEFAULT: '#D8F3DC',
        },
        dark: {
          DEFAULT: '#2D2A26',
        },
        cream: {
          DEFAULT: '#FCFBF9',
        },
        sand: {
          DEFAULT: '#F5F2EB',
        },
        clay: {
          DEFAULT: '#EBE7DC',
        },
        sunared: {
          DEFAULT: '#D90429',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'sheet-in': 'sheet-in 380ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fade-in 200ms ease-out forwards',
      },
      keyframes: {
        'sheet-in': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
