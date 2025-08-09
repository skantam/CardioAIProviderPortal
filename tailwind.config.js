/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
      },
      fontFamily: {
        sans: ['Open Sans', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
