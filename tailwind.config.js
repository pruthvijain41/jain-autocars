/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af', // Deep Royal Blue
          hover: '#1e3a8a',
          light: '#3b82f6',
        },
        accent: {
          DEFAULT: '#d97706', // Gold/Amber
          hover: '#b45309',
          light: '#fbbf24',
        },
        surface: {
          DEFAULT: '#ffffff',
          50: '#f8fafc', // Soft Cloud
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        text: {
          main: '#0f172a', // Slate 900
          secondary: '#475569', // Slate 600
          muted: '#94a3b8', // Slate 400
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.03), 0 8px 16px -4px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}