/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bio-black': '#0a0a0f',
        'bio-cyan': '#00f5d4',
        'bio-violet': '#9b5de5',
        'bio-white': '#f5f5f7',
      },
      fontFamily: {
        'geo': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [],
}
