import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        surface: {
          50: "#1e293b",
          100: "#161f30",
          200: "#0f1624",
          300: "#0b101b",
          card: "rgba(15, 22, 36, 0.75)",
          cardHover: "rgba(22, 31, 48, 0.9)",
        },
        brand: {
          50: "#ffe5e7",
          100: "#ffccd0",
          400: "#ff4d5a",
          500: "#e50914",
          600: "#c40711",
          700: "#99050d",
          glow: "rgba(229, 9, 20, 0.35)",
        },
        cinema: {
          gold: "#f59e0b",
          goldGlow: "rgba(245, 158, 11, 0.3)",
          neon: "#38bdf8",
          purple: "#a855f7",
          screen: "#3b82f6",
        },
        seat: {
          standard: "#334155",
          vip: "#854d0e",
          couple: "#831843",
          selected: "#e50914",
          booked: "#1e293b",
          held: "#f59e0b",
        }
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(229, 9, 20, 0.4)",
        "glow-gold": "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        "glow-blue": "0 0 25px -5px rgba(56, 189, 248, 0.4)",
        screen: "0 -15px 45px 5px rgba(56, 189, 248, 0.25)",
      },
      backgroundImage: {
        "cinema-gradient": "radial-gradient(circle at 50% -20%, rgba(229, 9, 20, 0.15), transparent 70%), radial-gradient(circle at 100% 50%, rgba(56, 189, 248, 0.08), transparent 50%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.02) 100%)",
      },
      keyframes: {
        pulseSlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-slow": "pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
