/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#0B1520',
        surface:     '#111F2E',
        surface2:    '#162435',
        border:      '#1E3045',
        txt:         '#E2EBF4',
        txt2:        '#6b8299',
        accent:      '#0D9488',
        'accent-dim':'rgba(13,148,136,0.12)',
        ok:          '#16a34a',
        danger:      '#dc2626',
      },
      fontFamily: {
        mono: ["'SF Mono'", 'Consolas', "'Cascadia Code'", 'monospace'],
      },
    },
  },
  plugins: [],
}
