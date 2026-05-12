/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flow State Background Colors
        'flow-purple': '#8894d1',
        'flow-green': '#cae892',
        'flow-lavender': '#dfc9e6',
        'flow-yellow': '#fdfac5',
        'flow-pink': '#dfa4c6',
        
        // Flow State Text Colors
        'text-light-purple': '#cad1f1',
        'text-white': '#ffffff',
        'text-gray': '#adadad',
        'text-light-green': '#d2f4b0',
        
        // Keep primary for buttons/interactive elements
        primary: {
          50: '#f3f4f9',
          100: '#e7e9f3',
          200: '#cad1f1',
          300: '#8894d1',
          400: '#7281c5',
          500: '#5c6eb9',
          600: '#4a5ba0',
          700: '#3c4982',
          800: '#333e6b',
          900: '#2d355a',
        },
      },
      fontFamily: {
        // Heading font - Chicle
        heading: ['Chicle', 'serif'],
        // Body font - Combo
        sans: ['Combo', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'bounce-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'slide-down': 'slide-down 1s ease-out',
        'fade-in': 'fade-in 1s ease-in',
        'bounce-slow': 'bounce-slow 2s infinite',
      },
    },
  },
  plugins: [],
}