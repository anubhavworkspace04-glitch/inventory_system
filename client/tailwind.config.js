/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand teal palette (primary accent)
        brand: {
          50:  '#F3FCFD',
          100: '#E8F8FA',
          200: '#C5EFF4',
          300: '#8DDFEA',
          400: '#4CC8D8',
          500: '#0FA3B1',  // PRIMARY
          600: '#0D91A0',
          700: '#087F8C',  // DARK PRIMARY
          800: '#066470',
          900: '#044A53',
        },
        // Neutral surface palette (replaces slate in the dark theme)
        surface: {
          page:    '#F8FAFB',
          card:    '#FFFFFF',
          raised:  '#FAFCFD',
          border:  '#E5E7EB',
          border2: '#EEF0F2',
          input:   '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
