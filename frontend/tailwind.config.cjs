/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-red': '#e40c2c',
        'brand-red-dark': '#c00a24',
        'brand-red-light': '#ff1a3d',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
