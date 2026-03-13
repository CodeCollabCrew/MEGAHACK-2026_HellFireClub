/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "#EDE6D8",
          50: "#FAF8F5",
          100: "#F5F1EA",
          200: "#EDE6D8",
          300: "#E0D5C0",
          400: "#CFC0A0",
          500: "#BAAA88",
        },
        cocoa: {
          DEFAULT: "#311B14",
          50: "#7A4A38",
          100: "#5C3328",
          200: "#45241C",
          300: "#311B14",
          400: "#200F0A",
          500: "#120806",
        },
        brown: {
          soft: "#6B3F2A",
          mid: "#4A2318",
          light: "#C4A882",
          muted: "#9C7B5E",
          warm: "#8B5E3C",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
        serif: ["Playfair Display", "serif"],
      },
      backgroundImage: {
        "ivory-grain": "url('/grain.png')",
        "cocoa-gradient": "linear-gradient(135deg, #311B14 0%, #4A2318 50%, #200F0A 100%)",
        "ivory-gradient": "linear-gradient(135deg, #FAF8F5 0%, #EDE6D8 50%, #E0D5C0 100%)",
        "warm-gradient": "linear-gradient(135deg, #EDE6D8 0%, #C4A882 100%)",
      },
      boxShadow: {
        "cocoa-sm": "0 2px 8px rgba(49, 27, 20, 0.12)",
        "cocoa-md": "0 4px 20px rgba(49, 27, 20, 0.18)",
        "cocoa-lg": "0 8px 40px rgba(49, 27, 20, 0.25)",
        "ivory-inner": "inset 0 2px 8px rgba(49, 27, 20, 0.06)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 10s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.5s ease forwards",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "grain": "grain 8s steps(10) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-2%, -3%)" },
          "20%": { transform: "translate(3%, 2%)" },
          "30%": { transform: "translate(-1%, 4%)" },
          "40%": { transform: "translate(4%, -1%)" },
          "50%": { transform: "translate(-3%, 3%)" },
          "60%": { transform: "translate(2%, -4%)" },
          "70%": { transform: "translate(-4%, 1%)" },
          "80%": { transform: "translate(1%, -2%)" },
          "90%": { transform: "translate(-2%, 4%)" },
        },
      },
    },
  },
  plugins: [],
};
