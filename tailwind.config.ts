import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0b1628",
          light: "#162235",
        },
        accent: {
          DEFAULT: "#0EA5E9",
        },
        success: {
          DEFAULT: "#34D399",
        },
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
export default config;
