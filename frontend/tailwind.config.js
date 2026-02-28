/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        mint: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        sage: {
          50: '#f8faf8',
          100: '#eef3ee',
          200: '#d4e4d4',
          300: '#adc9ad',
          400: '#7da87d',
          500: '#5a8a5a',
        },
        warm: {
          50: '#fafaf8',
          100: '#f5f5f0',
          200: '#ebebdf',
          300: '#d6d6c4',
        }
      },
      boxShadow: {
        'soft': '0 2px 20px rgba(0,0,0,0.06)',
        'card': '0 4px 40px rgba(0,0,0,0.08)',
        'float': '0 8px 60px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      }
    }
  },
  plugins: []
}
