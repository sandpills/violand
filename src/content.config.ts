import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogs = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blogs' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.date(),
        tags: z.array(z.string()).default([]),
        heroImage: z.string().optional(),
        gallery: z.array(z.object({
            src: z.string(),
            alt: z.string(),
            caption: z.string().optional(),
        })).optional(),
    }),
});

const projects = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
    schema: z.object({
        title: z.string(),
        year: z.number(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        heroImage: z.string().optional(),
        link: z.string().optional(),
    }),
});

const events = defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
    schema: z.object({
        title: z.string(),
        date: z.date(),
        description: z.string().optional(),
        link: z.string().url().optional().or(z.literal("")),
        embed: z.string().url().optional(),
        tags: z.array(z.string()).default([]),
    })
        .transform((data) => ({
            ...data,
            status: data.date > new Date() ? 'upcoming' : 'past' as 'upcoming' | 'past'
        })),
});

export const collections = { blogs, projects, events };