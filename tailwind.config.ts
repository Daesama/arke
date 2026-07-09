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
        cyan: {
          DEFAULT: "#00F0FF",
          50: "#E0FDFF",
          100: "#B3FAFF",
          200: "#80F6FF",
          300: "#4DF3FF",
          400: "#26F1FF",
          500: "#00F0FF",
          600: "#00C4D1",
          700: "#0098A3",
          800: "#006C75",
          900: "#004047",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          50: "#F0EAFE",
          100: "#DDD2FC",
          200: "#BBA5F9",
          300: "#9A79F7",
          400: "#8B5CF6",
          500: "#7C3FF4",
          600: "#6622F2",
          700: "#5217C7",
          800: "#3F129B",
          900: "#2C0D6E",
        },
        magenta: {
          DEFAULT: "#FF2D95",
          50: "#FFE5F2",
          100: "#FFCCE5",
          200: "#FF99CC",
          300: "#FF66B2",
          400: "#FF2D95",
          500: "#E6007A",
          600: "#CC006C",
          700: "#B3005F",
          800: "#990051",
          900: "#800044",
        },
        void: "#0A0A0F",
        deep: "#12121A",
        surface: "#1C1C28",
        elevated: "#2A2A3A",
        "text-primary": "#EEEEF0",
        "text-secondary": "#B0B0BE",
        "text-muted": "#7A7A8E",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.3)",
        "glow-cyan-lg": "0 0 40px rgba(0, 240, 255, 0.4)",
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.3)",
        "glow-violet-lg": "0 0 40px rgba(139, 92, 246, 0.4)",
        "glow-magenta": "0 0 20px rgba(255, 45, 149, 0.3)",
        "glow-magenta-lg": "0 0 40px rgba(255, 45, 149, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-up": "fadeUp 0.5s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 240, 255, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 240, 255, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
