import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          "bg-primary": "#36393f",
          "bg-secondary": "#32353b",
          "bg-tertiary": "#2f3136",
          "bg-quaternary": "#26292e",
          "text-primary": "#ffffff",
          "text-secondary": "#b9bbbe",
          "text-muted": "#8e9297",
          "text-link": "#00aff4",
          accent: "#5865f2",
          success: "#3ba55d",
          warning: "#faa81a",
          danger: "#ed4245",
          boost: "#f47fff",
        },
      },
      fontFamily: {
        sans: ['GGSans', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
