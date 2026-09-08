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
          DEFAULT: 'var(--color-primary, #059669)',
          dark: 'var(--color-primary-dk, #047857)',
          light: 'var(--color-accent, #ECFDF5)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary, #10B981)',
        },
        accent: {
          DEFAULT: 'var(--color-accent, #D1FAE5)',
        },
        surface: {
          DEFAULT: 'var(--color-surface, #FFFFFF)',
          subtle: 'var(--color-surface-2, #F8FAFC)',
          border: 'var(--color-surface-3, #E2E8F0)',
        },
        dark: {
          DEFAULT: 'var(--color-on-surface, #0F172A)',
        },
        cream: {
          DEFAULT: '#FCFBF9',
        },
        sand: {
          DEFAULT: '#F8FAFC',
        },
        clay: {
          DEFAULT: '#F1F5F9',
        },
        sunared: {
          DEFAULT: '#EF4444',
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
