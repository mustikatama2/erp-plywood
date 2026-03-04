/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Remap gray to warm olive — all existing gray-* classes shift automatically
      colors: {
        gray: {
          50:  '#F4F5EF',
          100: '#E8EBE0',
          200: '#CDD3C0',
          300: '#AABA9C',
          400: '#7D8C6E',
          500: '#5C6A50',
          600: '#47523D',
          700: '#333C28',
          800: '#232B18',
          900: '#191E10',
          950: '#10130A',
        },
        // Brand palette
        brand: {
          gold:       '#F0C200',
          'gold-dark':'#C4A300',
          'gold-muted':'#9A7E00',
          forest:     '#1B6830',
          'forest-light': '#2EA84A',
          timber:     '#8B5E3C',
          dark:       '#1A1C14',
          olive:      '#5A6352',
          cream:      '#F6F7F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Subtle wood-grain SVG pattern for sidebar
        'wood-grain': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M0 30 Q25 28 50 32 Q75 36 100 30 L100 34 Q75 40 50 36 Q25 32 0 34Z' fill='%23F0C200'/%3E%3Cpath d='M0 55 Q30 52 60 58 Q80 62 100 55 L100 59 Q80 66 60 62 Q30 56 0 59Z' fill='%23F0C200'/%3E%3Cpath d='M0 78 Q20 75 50 80 Q75 84 100 78 L100 82 Q75 88 50 84 Q20 79 0 82Z' fill='%23F0C200'/%3E%3C/g%3E%3C/svg%3E")`,
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
