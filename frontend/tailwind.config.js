/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fa",
        "on-surface": "#2b3437",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f1f4f6",
        "outline-variant": "#abb3b7",
        primary: "#005bc0",
        "primary-container": "#d8e2ff",
      },
      boxShadow: {
        signature: "0 4px 20px rgba(43,52,55,0.06)",
      },
    },
  },
  plugins: [],
};