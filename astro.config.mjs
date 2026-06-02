// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';


export default defineConfig({
    vite: {
        plugins: [tailwindcss()],
    },

    integrations: [svelte(), mdx()],
    site: 'https://viola.city',
    base: undefined,
});