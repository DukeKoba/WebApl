/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#C9891F', light: '#E0A94B', dark: '#8A5A12' },
        secondary: { DEFAULT: '#EFC979', light: '#FAEBC8' },
        surface: { DEFAULT: '#FFFFFF', soft: '#FBF7F0', dark: '#1A1613' },
        'text-primary': '#1A1613',
        'text-secondary': '#5B544D',
        'text-muted': '#8E867D',
        border: '#EAE4DA',
      },
    },
  },
  plugins: [],
};
