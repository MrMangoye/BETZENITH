/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bet-bg': '#000000',
        'bet-card': '#1a1f2e',
        'bet-card-hover': '#252b3d',
        'bet-accent': '#9ACD32', // Yellow-Green
        'bet-accent-hover': '#8BB82D',
        'bet-success': '#9ACD32',
        'bet-danger': '#ff4d4d',
        'bet-warning': '#ffb800',
        'bet-gray': '#2a2f3f',
        'bet-gray-hover': '#353b4d',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'odds-change': 'oddsPulse 0.5s ease-in-out',
        'live-pulse': 'livePulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        oddsPulse: {
          '0%, 100%': { transform: 'scale(1)', color: '#9ACD32' },
          '50%': { transform: 'scale(1.1)', color: '#8BB82D' },
        },
        livePulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        }
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}