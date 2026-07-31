/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        revive: {
          bg: '#F7FAF7',
          'bg-dark': '#101714',
          card: '#FFFFFF',
          'card-dark': '#18221D',
          primary: '#3A8D6D',
          'primary-dark': '#65B98A',
          secondary: '#A8D5BA',
          ink: '#17201C',
          'ink-dark': '#E9F2EC',
          muted: '#6B7280',
          'muted-dark': '#9BAAA0',
          mist: '#EAF3ED',
          'mist-dark': '#1F2B25',
          storm: '#5E7C91',
          'storm-dark': '#96B1C4',
          'storm-chip': '#E9F0F4',
          'storm-chip-dark': '#1E2A32',
        },
      },
    },
  },
  plugins: [],
};
