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
 * Get a properly formatted link href for navigation
 */
export function getLinkHref(href: string): string {
    // External links (including email) should not get base path
    if (href.startsWith('http') || href.startsWith('mailto:')) {
        return href;
    }

    const base = import.meta.env.BASE_URL || '';

    // If no base or href already starts with base, return as-is
    if (!base || href.startsWith(base)) {
        return href;
    }

    // For internal links, add base path
    const cleanHref = href.startsWith('/') ? href : '/' + href;
    const baseWithoutSlash = base.endsWith('/') ? base.slice(0, -1) : base;

    return baseWithoutSlash + cleanHref;
} 