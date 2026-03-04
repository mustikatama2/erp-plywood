/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Warm olive gray scale — light content area, dark sidebar stays dark
      // 50-300: light cream tones (content bg, cards, borders)
      // 500-700: readable text on light bg
      // 800-950: dark olive (sidebar, dark UI elements)
      colors: {
        gray: {
          50:  '#FDFCF8',   // near-white warm
          100: '#F5F1E9',   // warm cream
          200: '#E5DFD3',   // warm border
          300: '#C9BFA8',   // medium warm
          400: '#9A917C',   // muted text
          500: '#6E6D5C',   // secondary text
          600: '#4E5440',   // medium olive
          700: '#373D2C',   // dark text on light
          800: '#252C1A',   // very dark olive
          900: '#1A2013',   // near-black olive
          950: '#12160C',   // darkest
        },
        // Brand palette
        brand: {
          gold:        '#F0C200',
          'gold-dark': '#C4A300',
          'gold-muted':'#9A7E00',
          forest:      '#1B6830',
          'forest-light': '#2EA84A',
          timber:      '#8B5E3C',
          dark:        '#1A1C14',
          olive:       '#5A6352',
          cream:       '#F5F1E9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(26,28,20,0.08), 0 1px 2px -1px rgba(26,28,20,0.06)',
        'card-hover': '0 4px 12px 0 rgba(26,28,20,0.10), 0 2px 4px -1px rgba(26,28,20,0.06)',
        'modal': '0 20px 60px 0 rgba(26,28,20,0.25)',
      },
      backgroundImage: {
        // Subtle wood-grain for sidebar only
        'wood-grain': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-opacity='0.03'%3E%3Cpath d='M0 30 Q25 28 50 32 Q75 36 100 30 L100 34 Q75 40 50 36 Q25 32 0 34Z' fill='%23F0C200'/%3E%3Cpath d='M0 55 Q30 52 60 58 Q80 62 100 55 L100 59 Q80 66 60 62 Q30 56 0 59Z' fill='%23F0C200'/%3E%3Cpath d='M0 78 Q20 75 50 80 Q75 84 100 78 L100 82 Q75 88 50 84 Q20 79 0 82Z' fill='%23F0C200'/%3E%3C/g%3E%3C/svg%3E")`,
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
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
