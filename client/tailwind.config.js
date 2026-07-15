/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1B4EF5",
        hover: "#3874FF",
        accent: "#5996FF",
        highlight: "#F4CEFF",
        background: "#050816",
        surface: "#0E1328",
        glass: "rgba(255,255,255,0.06)",
        borderColor: "rgba(255,255,255,0.12)",
        textPrimary: "#FFFFFF",
        textSecondary: "#CBD5E1",
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
