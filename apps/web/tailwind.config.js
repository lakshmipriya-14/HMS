/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Unified Healthcare Palette: Medical Blue + Teal + White
        hospital: {
          50: '#F8FAFC',   // Soft White Background
          100: '#E8F1FC',  // Soft Medical Blue Surface
          200: '#BFDBFE',  // Medical Blue Border
          500: '#1565C0',  // Primary Medical Blue
          600: '#0D47A1',  // Hover / Pressed Medical Blue
          700: '#00897B',  // Secondary Teal
          800: '#183153',  // Dark Navy Headings / Sidebar
          900: '#183153',  // Dark Navy
        },
        clinical: {
          blue: '#1565C0',
          navy: '#183153',
          dark: '#0D47A1',
          teal: '#00897B',
          slate: '#475569',
          emerald: '#16A34A',
          amber: '#F59E0B',
          rose: '#DC2626',
        },
      },
    },
  },
  plugins: [],
};
