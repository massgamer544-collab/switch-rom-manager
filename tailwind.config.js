/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'gh-bg': '#0D1117',
        'gh-bg-subtle': '#161B22',
        'gh-border': '#30363D',
        'gh-text': '#C9D1D9',
        'gh-text-muted': '#8B949E',
        'gh-accent': '#58A6FF',
        'switch-red': '#FF3C28',
        'switch-blue': '#0AB9E6',
        'switch-gold': '#FFD700',
      },
      fontFamily: {
        'unbounded': ['Unbounded', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}