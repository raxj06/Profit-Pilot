/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        success: "#059669",
        warning: "#ea580c",
        dark: "#1e293b"
      }
    },
  },
  plugins: [],
}
