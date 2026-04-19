/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["'Bricolage Grotesque'", "'Manrope'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Crystality-inspired palette — pure black + violet accent
        bg: "#050505",
        "bg-soft": "#0b0b0f",
        surface: "#0f0f14",
        "surface-hover": "#16161d",
        border: "rgba(255, 255, 255, 0.08)",
        "border-hover": "rgba(139, 92, 246, 0.35)",
        accent: "#8b5cf6",           // violet-500
        "accent-hover": "#7c3aed",   // violet-600
        "accent-deep": "#5b21b6",    // violet-800
        "accent-glow": "rgba(139, 92, 246, 0.35)",
        secondary: "#a855f7",
        "secondary-glow": "rgba(168, 85, 247, 0.25)",
        green: "#22c55e",
        "green-dim": "rgba(34, 197, 94, 0.12)",
        "t-primary": "#ffffff",
        "t-secondary": "#b8b8c4",
        "t-muted": "#6e6e7a",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        marquee: { from: { transform: "translateX(0%)" }, to: { transform: "translateX(-50%)" } },
        "slow-pulse": { "0%,100%": { opacity: "0.55" }, "50%": { opacity: "0.9" } },
        "slow-float": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        "glow-shift": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(40px,-20px) scale(1.1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 40s linear infinite",
        "slow-pulse": "slow-pulse 6s ease-in-out infinite",
        "slow-float": "slow-float 5s ease-in-out infinite",
        "glow-shift": "glow-shift 14s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        "violet-glow": "0 10px 40px -10px rgba(139, 92, 246, 0.55)",
        "violet-soft": "0 4px 24px -8px rgba(139, 92, 246, 0.4)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
