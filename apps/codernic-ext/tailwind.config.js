/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Scan Atomos Structura components for Tailwind classes
    './node_modules/@atomos-web/structura/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@atomos-web/structura-core/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@atomos-web/prime/src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@atomos-web/prime-style/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [],
  darkMode: 'class'
};
