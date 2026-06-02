/**
 * Minimal inline markdown -> safe HTML.
 *
 * Supports: line breaks, **bold**, *italic*, and [text](url).
 * Deliberately tiny — no headings/lists/images, no dependency.
 *
 * Security: HTML is escaped first, so user text can never inject tags. Links
 * are only emitted for http(s)/mailto/relative URLs (blocks javascript: etc.).
 */
export function renderInline(input: string): string {
    const escaped = String(input ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    let out = escaped;

    // [text](url) — validate the scheme before linking
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
        const safe = /^(https?:\/\/|mailto:|\/)/i.test(url);
        if (!safe) return text;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // **bold** (before italic so ** isn't eaten by the * rule)
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // *italic*
    out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    // line breaks
    out = out.replace(/\n/g, "<br>");

    return out;
}
