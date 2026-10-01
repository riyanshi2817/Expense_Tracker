/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {
    colors: {
      surface: { DEFAULT: 'var(--background)', elevated: 'var(--card)', muted: 'var(--muted)' },
      accent: { DEFAULT: 'var(--primary)', soft: 'var(--primary-foreground)' },
      ink: { DEFAULT: 'var(--foreground)', secondary: 'var(--secondary-foreground)', muted: 'var(--muted-foreground)' },
      border: 'var(--border)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--destructive)',
    },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'], display: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
    spacing: { 18: '4.5rem', 22: '5.5rem' },
    borderRadius: { card: 'var(--radius-card)' },
    boxShadow: { card: 'var(--shadow-card)', glow: 'none' },
  } },
}
