/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 只有显式添加 'dark' class 时才启用暗色模式
  content: [
    "./index.html",
    "./newtab.html", 
    "./popup.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./dist/**/*.{html,js}",
  ],
  safelist: [
    // 确保常用类名不被purge
    'rounded-lg',
    'border',
    'bg-white',
    'shadow-sm',
    'shadow-lg',
    'shadow-xl',
    'backdrop-blur-sm',
    'border-white/20',
    'bg-white/80',
    'text-slate-950',
    'text-slate-500',
    'text-slate-400',
    'border-slate-200',
    'text-2xl',
    'font-semibold',
    'leading-none',
    'tracking-tight',
    'text-sm',
    'flex',
    'flex-col',
    'space-y-1.5',
    'space-y-2',
    'space-y-4',
    'space-x-2',
    'p-6',
    'pt-0',
    'pb-3',
    'items-center',
    'justify-between',
    'w-full',
    'h-5',
    'w-5',
    'mt-4',
    'mb-2',
    'mb-6',
    'text-lg',
    'text-green-600',
    'text-blue-600',
    'text-purple-600',
    'text-gray-600',
    'font-medium',
    'grid',
    'grid-cols-1',
    'md:grid-cols-2',
    'lg:grid-cols-3',
    'gap-4',
    'gap-6',
    'hover:shadow-xl',
    'transition-shadow',
    'disabled',
    'mt-8',
    // 添加更多可能用到的类名
    {
      pattern: /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    {
      pattern: /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/,
    }
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
