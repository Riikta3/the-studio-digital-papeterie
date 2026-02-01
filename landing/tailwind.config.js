/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../shared/tailwind-preset.js")],
  content: ["./src/**/*.{ts,tsx}", "../shared/components/**/*.{js,ts,jsx,tsx}"],
};
