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
        NeueMontreal: ['"Neue Montreal"', 'sans serif'],
      },
      colors: {
        offblack: '#3a3a3a',     // Text Color
        offwhite: '#ffffff',     // Sidebar Color
        lightgray: '#d1d1d1',    // Background Color
        gray: '#f0f0f0',         // Projects Hover Color
        darkgray: '#585858',     // Dark Grey Text Color
        brand: '#007bff',        // Blue Color
        brandhover: '#0056b3',   // Blue Hover Color
        success: '#4caf50',      // Green Color
        successhover: '#388e3c', // Green Hover Color
        warning: '#ff5722',      // Red Color
        warninghover: '#e64a19', // Red Hover Color
      },
    },
  },
  plugins: [],
};

export default config;
