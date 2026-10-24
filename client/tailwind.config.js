/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skribbl: {
          blue: '#1b4a9c',
          sky: '#0284c7',
          yellow: '#f59e0b',
          green: '#10b981',
          panel: '#ffffff',
          dark: '#0f172a'
        }
      },
      fontFamily: {
        game: ['"Comic Neue"', 'cursive', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
