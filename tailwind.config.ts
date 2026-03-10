/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                /* ── Brand: Electric Cyan ── */
                brand: {
                    50: '#e6faff',
                    100: '#b3f0ff',
                    200: '#7DE8FF',
                    300: '#33DBFF',
                    400: '#00D4FF',  // PRIMARY
                    500: '#00BFEB',
                    600: '#0099CC',
                    700: '#0077A8',
                    800: '#005580',
                    900: '#003A58',
                    950: '#001E30',
                },
                /* ── Surface layers ── */
                surface: {
                    DEFAULT: '#09090E',   // page background
                    card: '#111118',      // card background
                    card2: '#16161F',     // secondary card
                    elevated: '#1A1A24',  // elevated / drawer backgrounds
                    border: '#1E1E2E',    // default border
                    hi: '#2A2A40',        // highlighted border
                    hover: '#1A1A24',     // hover state
                    input: '#0D0D14',     // input background
                },
                /* ── shadcn CSS variable bridges ── */
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                /* ── Signal colors ── */
                signal: {
                    orange: '#FF6B35',
                    green: '#00E878',
                    red: '#FF4757',
                    yellow: '#FFD60A',
                },
            },
            borderRadius: {
                'xs': '4px',
                'sm': '6px',
                DEFAULT: '8px',
                'md': '10px',
                'lg': '12px',
                'xl': '16px',
                '2xl': '20px',
                '3xl': '24px',
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #00D4FF 0%, #0099E6 100%)',
                'card-gradient': 'linear-gradient(145deg, #111118 0%, #0D0D14 100%)',
                'glow-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(0, 212, 255, 0.1) 0%, transparent 60%)',
            },
            boxShadow: {
                'brand-sm': '0 0 10px rgba(0, 212, 255, 0.2)',
                'brand': '0 0 20px rgba(0, 212, 255, 0.25)',
                'brand-lg': '0 0 40px rgba(0, 212, 255, 0.3)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255,255,255,0.03) inset',
                'lifted': '0 8px 32px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
            },
            animation: {
                'fade-in': 'fadeIn 0.25s ease-out both',
                'slide-up': 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
                'slide-down': 'slideDown 0.25s ease-out both',
                'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
                'shimmer': 'skeleton-shimmer 1.5s ease-in-out infinite',
                'text-shine': 'text-shimmer 4s linear infinite',
                'pulse-slow': 'pulse 4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                slideUp: {
                    from: { opacity: '0', transform: 'translateY(10px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    from: { opacity: '0', transform: 'translateY(-8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 12px rgba(0, 212, 255, 0.15)' },
                    '50%': { boxShadow: '0 0 28px rgba(0, 212, 255, 0.35)' },
                },
                'skeleton-shimmer': {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                'text-shimmer': {
                    '0%': { backgroundPosition: '0% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
            },
        },
    },
    plugins: [],
}
