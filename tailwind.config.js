/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Define your custom color palette
                'bg-light': '#c7c7c7',
                'bg-dark': '#1a1a1a',
                'text-light': '#000000',
                'text-dark': '#ffffff',
                'accent-light': '#2f00ff',
                'accent-dark': '#7c3aed',
            },
            animation: {
                marquee: 'marquee 30s linear infinite',
                marquee2: 'marquee2 30s linear infinite'
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-100%)' }
                },
                marquee2: {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0%)' }
                }
            },
            fontFamily: {
                'sixtyfour': ['Sixtyfour', 'serif'],
                'sixtyfour-convergence': ['Sixtyfour Convergence', 'serif'],
            },
        },
    },
    plugins: [],
}
