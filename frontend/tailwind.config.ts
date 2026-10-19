import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B0E14",
          card: "#151923",
          bubbleAi: "#151923",
          bubbleUser: "#283448",
          input: "#1F2433",
          inputFocus: "#263440",
          border: "#2E3A59",
        },
        accent: {
          tealFrom: "#80E8C6",
          tealTo: "#00BFA5",
          purple: "#7D5FFF",
          danger: "#FF4757",
          dangerAlt: "#FF3E6C",
          success: "#2ECC71",
        },
      },
      borderRadius: {
        card: "24px",
        pill: "999px",
      },
      boxShadow: {
        card: "0px 10px 40px rgba(0,0,0,0.2)",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeSlideIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        fadeSlideIn: "fadeSlideIn 0.25s ease-out",
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
