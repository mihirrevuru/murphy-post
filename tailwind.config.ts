import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-ibm-plex-mono)", "Courier New", "monospace"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        newsprint: "#F5F0E8",
        ink: "#1A1A1A",
        "newsprint-accent": "#F5E6C8",
        "murphy-red": "#C41E3A",
      },
    },
  },
  plugins: [],
};

export default config;
