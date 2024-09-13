import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        JetBrainsMono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        offblack: '#333333',  // Nowe tło (czarny)
        offwhite: '#f7f7f7',  // Nowy tekst (biały)
        lightgray: '#d1d1d1',  // Zachowano, ale można zmienić#d1d1d1
        darkgray: '#2c2c2c', // Zachowano, ale można zmienić
        bluecustom: '#3498db', // Nowy akcent
        bluehover: '#2980b9', // Nowy hover
        greencustom: '#2a9d8f', // Zielony kolor
        greenhover: '#238c77', // Zielony kolor hover (mniejsza różnica)
      },
    },
  },
  plugins: [],
};

export default config;
