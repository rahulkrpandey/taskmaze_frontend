/** @type {import('tailwindcss').Config} */
const { blackA, mauve, violet, green } = require("@radix-ui/colors");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        heading: "#212121",
        para: "#5A5A65",
        background: "#F3F4F4",
        icon: "#5A5A65",
        iconBg: "#E1E4E8",
        inputBorder: "#1e293b",
        ...blackA,
        ...mauve,
        ...violet,
        ...green,
      },
      keyframes: {
        overlayShow: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        contentShow: {
          from: { opacity: 0, transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        },
      },
      animation: {
        overlayShow: "overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
