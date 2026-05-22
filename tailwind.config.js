/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Legacy tokens (kept so existing pages don't break while we migrate)
        primary: {
          DEFAULT: '#1e40af',
          hover: '#1e3a8a',
          light: '#3b82f6',
        },
        accent: {
          DEFAULT: '#d97706',
          hover: '#b45309',
          light: '#fbbf24',
        },
        surface: {
          DEFAULT: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        text: {
          main: '#0f172a',
          secondary: '#475569',
          muted: '#94a3b8',
        },
        // Editorial design system (warm ivory + deep ink + champagne)
        ivory: {
          DEFAULT: '#F4F0E8',
          soft: '#EFEAE0',
          deep: '#E7E1D3',
        },
        ink: {
          DEFAULT: '#0E0E0C',
          soft: '#1A1A17',
          muted: '#5C5A52',
          faint: '#8A8678',
        },
        champagne: {
          DEFAULT: '#B8956A',
          deep: '#9A7748',
          light: '#D6B98F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui'],
        heading: ['Outfit', 'sans-serif'],
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia'],
        mono: ['"Geist Mono"', 'ui-monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px -4px rgba(0,0,0,0.08)',
        'editorial': '0 24px 60px -20px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
