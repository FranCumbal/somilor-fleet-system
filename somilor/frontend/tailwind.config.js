/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C8A84B',
          light: '#E2C97A',
          dim: '#8B7233',
        },
        dark: {
          DEFAULT: '#0E1117',
          panel: '#161B26',
          panel2: '#1C2232',
          panel3: '#222A3D',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
