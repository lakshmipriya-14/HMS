/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep Clinical Healthcare Palette: Trustworthy Teal, Healing Emerald & Soft Blues
        hospital: {
          50: '#F0FDF4',
          100: '#E0F2FE',
          200: '#BAE6FD',
          500: '#0F766E', // Deep Clinical Teal
          600: '#0D9488',
          700: '#115E59',
          800: '#134E4A',
          900: '#042F2E',
        },
        clinical: {
          blue: '#0284C7',
          dark: '#0369A1',
          teal: '#14B8A6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#E11D48',
        },
      },
    },
  },
  plugins: [],
};
