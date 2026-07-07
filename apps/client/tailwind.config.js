/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#202522",
        paper: "#f6f2ea",
        clay: "#b8674f",
        moss: "#4d7f68"
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["Cascadia Mono", "SFMono-Regular", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
