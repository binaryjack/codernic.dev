/**
 * Shared Tailwind CSS preset — consumed by dag-editor and showcase-web.
 *
 * Usage in tailwind.config.ts:
 *   import sharedPreset from '@ai-agencee/ui/tailwind.preset'
 *   export default { presets: [sharedPreset], content: ['./src/**\/*.tsx'] }
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
        success: {
          100: 'var(--status-success-100, #dcfce7)',
          500: 'var(--status-success, #4ade80)',
          700: 'var(--status-success-700, #15803d)',
        },
        warning: {
          100: 'var(--status-warning-100, #fef9c3)',
          500: 'var(--status-warning, #f59e0b)',
          700: 'var(--status-warning-700, #b45309)',
        },
        danger: {
          100: 'var(--status-error-100, #fee2e2)',
          500: 'var(--status-error, #f87171)',
          700: 'var(--status-error-700, #b91c1c)',
        },
        neutral: {
          50:  'var(--neutral-50, #f8fafc)',
          100: 'var(--neutral-100, #f1f5f9)',
          200: 'var(--neutral-200, #e2e8f0)',
          300: 'var(--neutral-300, #cbd5e1)',
          400: 'var(--neutral-400, #94a3b8)',
          500: 'var(--neutral-500, #64748b)',
          600: 'var(--neutral-600, #475569)',
          700: 'var(--neutral-700, #334155)',
          800: 'var(--neutral-800, #1e293b)',
          900: 'var(--neutral-900, #0f172a)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        node: '0.5rem',
      },
    },
  },
  plugins: [],
}
