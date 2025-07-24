/**
 * Utility for handling base paths in development vs production
 */

/**
 * Joins the base URL with a path, ensuring proper slash handling
 */
export function getAssetPath(path: string): string {
    const base = import.meta.env.BASE_URL || '/';

    // Remove leading slash from path if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Ensure base ends with slash
    const baseWithSlash = base.endsWith('/') ? base : base + '/';

    return baseWithSlash + cleanPath;
}

/**
 * Get a properly formatted link href
 */
export function getLinkHref(href: string): string {
    // External links should not get base path
    if (href.startsWith('http')) {
        return href;
    }

    const base = import.meta.env.BASE_URL || '';

    // If href already starts with base, don't double-add
    if (base && href.startsWith(base)) {
        return href;
    }

    // For internal links, just return as-is - Astro handles these automatically
    return href;
} 