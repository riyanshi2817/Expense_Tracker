/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0B1020',
          elevated: '#121A2B',
          muted: '#192338',
        },
        accent: {
          DEFAULT: '#7C6CFF',
          soft: '#A9A0FF',
        },
        ink: {
          DEFAULT: '#F7F8FC',
          secondary: '#A6B0C3',
          muted: '#717D94',
        },
        border: '#25314A',
        success: '#42D392',
        warning: '#F4C95D',
        danger: '#FF667A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      borderRadius: {
        card: '1.5rem',
      },
      boxShadow: {
        card: '0 24px 70px rgba(0, 0, 0, 0.28)',
        glow: '0 18px 50px rgba(124, 108, 255, 0.24)',
      },
    },
  },
}
