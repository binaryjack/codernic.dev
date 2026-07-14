/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Brand amber — mirrors CSS tokens */
        amber: {
          950: '#1a0f00',
          900: '#451a03',
          800: '#78350f',
          700: '#92400e',
          600: '#b45309',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
          200: '#fde68a',
          100: '#fef3c7',
        },
        /* Background layers */
        base:    '#07090c',
        panel:   '#0d1117',
        surface: '#111620',
        /* Border */
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          active:  'rgba(245,158,11,0.40)',
          subtle:  'rgba(255,255,255,0.04)',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        amber:  '0 0 24px rgba(245,158,11,0.18)',
        panel:  '-2px 0 20px rgba(0,0,0,0.4)',
        card:   '0 4px 16px rgba(0,0,0,0.6)',
        'amber-ring': '0 0 0 1px #f59e0b, 0 0 24px rgba(245,158,11,0.18)',
      },
      backgroundImage: {
        'amber-gradient':  'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)',
        'divider-fade':    'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(255,255,255,0.07) 40%, transparent 100%)',
        'panel-gradient':  'linear-gradient(180deg, rgba(245,158,11,0.03) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
