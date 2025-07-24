// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';


export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [svelte()],
    site: 'https://sandpills.github.io',
    base: import.meta.env.PROD ? '/violand' : undefined,
});