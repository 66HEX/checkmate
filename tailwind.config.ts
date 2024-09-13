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
        bluecustom: '#5b8fd8', // More subtle blue
        bluehover: '#4682b4',  // More subtle blue hover
        greencustom: '#4a9a8e', // More subtle green
        greenhover: '#3b8f77', // More subtle green hover
        redcustom: '#c0392b',   // More subtle red
        redhover: '#a03b2b',    // More subtle red hover
      },
    },
  },
  plugins: [],
};

export default config;
