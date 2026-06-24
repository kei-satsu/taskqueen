/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 ဒီလမ်းကြောင်း တိကျရပါမယ်
  ],
  theme: {
    extend: {
      colors: {
        queenPink: '#fbcfe8',
        queenPurple: '#6d28d9',
      }
    },
  },
  plugins: [],
}