/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#9a2119",
        brandDeep: "#6c160f",
        paper: "#f8f2ef",
        ink: "#241c1a",
        muted: "#6f6663",
        line: "#e7d8d2",
        success: "#2f9367",
        warn: "#cb9c48",
        info: "#3774d8",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(54, 25, 18, 0.08)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [typography],
};
