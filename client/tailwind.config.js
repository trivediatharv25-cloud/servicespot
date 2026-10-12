/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f2f4f8",
          100: "#dfe4ee",
          200: "#bcc5d9",
          300: "#8f9bb8",
          400: "#66749a",
          500: "#3c4a6b",
          600: "#2d3a5a",
          700: "#1f2a45",
          800: "#182036",
          900: "#14213D",
          950: "#0d1526",
        },
        brass: {
          50: "#fbf5e7",
          100: "#f4e6bf",
          300: "#dfc078",
          400: "#d3ab54",
          500: "#C89B3C",
          600: "#a97e2c",
          700: "#8a6423",
        },
        paper: {
          DEFAULT: "#FAF7F2",
          100: "#FFFFFF",
          200: "#F1ECE2",
        },
        sage: {
          100: "#e4ece5",
          500: "#5B7A63",
          600: "#4a6350",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
