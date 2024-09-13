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
        NeueMontreal: ['"Neue Montreal"', 'sans-serif'],
      },
      colors: {
        offblack: '#3a3a3a',     // Text Color
        offwhite: '#ffffff',     // Background Color
        lightgray: '#d1d1d1',    // Light Gray Color
        gray: '#f0f0f0',         // Gray Color
        darkgray: '#585858',     // Dark Gray Color
        brand: '#007bff',        // Blue Color
        brandhover: '#0056d2',   // Slightly darker blue
        success: '#4caf50',      // Green Color
        successhover: '#388e3c', // Slightly darker green
        warning: '#ff5722',      // Red Color
        warninghover: '#e64a19', // Slightly darker red
      },
    },
  },
  plugins: [],
};

export default config;
