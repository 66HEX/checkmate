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
        offblack: '#333333',
        offwhite: '#f7f7f7',
        lightgray: '#d1d1d1',
        darkgray: '#444444',
        bluecustom: '#3498db',
        bluehover: '#2980b9',
        greencustom: '#2a9d8f',
        greenhover: '#238c77',
        redcustom: '#e74c3c', // Add your custom red color
        redhover: '#c0392b',  // Add your custom red hover color
      },
    },
  },
  plugins: [],
};

export default config;
