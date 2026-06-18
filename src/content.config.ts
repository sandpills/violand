import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// `date` may be a bare year (2022), year-month ("2023-05"), or full date
// (2025-08-26). Keep it un-coerced so src/utils/dates.ts can normalize each
// precision itself — z.coerce.date() would turn the bare integer into 1970.
const flexDate = z.union([z.string(), z.number(), z.date()]).optional();

const blogs = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blogs' }),
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
        // set on posts imported from Substack by scripts/sync-substack.mjs:
        // the original canonical URL, shown as a "read on substack" link
        source: z.string().url().optional(),
    }),
});

const projects = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
    schema: z.object({
        title: z.string(),
        // drives chronological sorting; only the year is shown in the UI
        date: flexDate,
        // legacy fallback; `date` takes precedence (see src/utils/dates.ts)
        year: z.number().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
        heroImage: z.string().optional(),
        // typed external links, rendered as labelled buttons (see
        // src/utils/projectLinks.ts). A project with a writeup shows these as
        // buttons; one without a writeup uses its first link as the card target.
        site: z.string().optional(),
        watch: z.string().optional(),
        listen: z.string().optional(),
        access: z.string().optional(),
    }),
});

const events = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
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

const things = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/things' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: flexDate,
        year: z.number().optional(),
        // primary destination: the title/row links straight here
        link: z.string().optional(),
        // typed external links, rendered as labelled buttons (see
        // src/utils/projectLinks.ts) for things with more than one link
        site: z.string().optional(),
        watch: z.string().optional(),
        listen: z.string().optional(),
        access: z.string().optional(),
        tags: z.array(z.string()).default([]).optional(),
        heroImage: z.string().optional()
    }),
});

const cv = defineCollection({
    loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cv' }),
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        lastUpdated: z.date().optional(),
        sections: z.array(z.object({
            name: z.string(),
            items: z.array(z.object({
                title: z.string().optional(),
                subtitle: z.string().optional(),
                description: z.string().optional(),
                date: z.string().optional(),
                link: z.string().optional(),
                location: z.string().optional(),
                tags: z.array(z.string()).default([]),
            })),
        })).optional(),
    }),
});

export const collections = { blogs, projects, events, things, cv };