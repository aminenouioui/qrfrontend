/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          background: 'hsl(var(--background) / <alpha-value>)',
          foreground: 'hsl(var(--foreground) / <alpha-value>)',
          primary: {
            DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
            foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
          },
          secondary: {
            DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
            foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
          },
          muted: {
            DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
            foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
            foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
          },
          border: 'hsl(var(--border) / <alpha-value>)',
          input: 'hsl(var(--input) / <alpha-value>)',
          ring: 'hsl(var(--ring) / <alpha-value>)',
          destructive: {
            DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
            foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
      },
    },
    plugins: [],
  }
  
  