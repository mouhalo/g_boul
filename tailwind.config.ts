import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#CC0000',    // Rouge
        secondary: '#CD853F',  // Marron clair
        accent: '#90EE90',     // Vert clair
        background: '#FFFFFF', // Blanc
        filter: '#F5F5DC',    // Beige
      },
    },
  },
  plugins: [],
}

export default config
