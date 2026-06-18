// Pulls posts from the Substack RSS feed and writes them into the local
// `blogs` content collection so they render through the site's own reader,
// with images downloaded into public/ (no hotlinking back to Substack).
//
// Runs automatically before `npm run build` (see package.json `prebuild`),
// or on demand with `npm run sync:substack`.
//
// Design notes:
// - Hand-written posts win: any feed post whose title matches a non-generated
//   blog file is skipped, so curated copies aren't clobbered by the import.
// - Generated files live under src/content/blogs/substack/ and images under
//   public/images/blogs/substack/<slug>/ — both are committed and regenerated
//   in place, so a network blip during a build just keeps the last good copy.
// - Substack's RSS only carries the most recent ~20 posts; older ones silently
//   drop out of the feed. For a bigger archive, a one-time Substack export is
//   the backstop (see the README note printed below if the feed looks short).

import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";

const FEED_URL = "https://v10101a.substack.com/feed";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "src/content/blogs/substack");
const IMG_DIR = path.join(ROOT, "public/images/blogs/substack");
const IMG_WEB_BASE = "/images/blogs/substack";

const log = (...a) => console.log("[substack]", ...a);

// normalize a title for duplicate detection across hand-written + feed posts
const titleKey = (s) =>
    (s || "")
        .toLowerCase()
        .replace(/&[a-z]+;|&#\d+;/g, " ") // strip entities
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

// ---- feed parsing (regex is fine: Substack's feed is consistent) ----------

function cdata(block, tag) {
    const m = block.match(
        new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`),
    );
    if (m) return m[1].trim();
    const plain = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return plain ? plain[1].trim() : "";
}

function parseFeed(xml) {
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    return items.map((item) => {
        const link = cdata(item, "link");
        const slugMatch = link.match(/\/p\/([^/?#]+)/);
        return {
            title: cdata(item, "title"),
            description: cdata(item, "description"),
            link,
            slug: slugMatch ? slugMatch[1] : titleKey(cdata(item, "title")),
            date: new Date(cdata(item, "pubDate")),
            html: cdata(item, "content:encoded"),
        };
    });
}

// ---- image download -------------------------------------------------------

// Substack image URLs look like:
//   https://substackcdn.com/image/fetch/$s_!x!,f_auto,.../https%3A%2F%2F<s3>...png
// We pull out the encoded original (clean extension) and save that.
function originalImageUrl(url) {
    const i = url.lastIndexOf("https%3A");
    if (i >= 0) return decodeURIComponent(url.slice(i));
    return url;
}

async function downloadImage(rawUrl, slug) {
    const orig = originalImageUrl(rawUrl);
    let filename;
    try {
        filename = path.basename(new URL(orig).pathname);
    } catch {
        filename = path.basename(orig.split("?")[0]);
    }
    if (!filename || !/\.[a-z0-9]+$/i.test(filename)) filename = `${filename || "img"}.png`;

    const dir = path.join(IMG_DIR, slug);
    const filepath = path.join(dir, filename);
    const webPath = `${IMG_WEB_BASE}/${slug}/${filename}`;

    if (fs.existsSync(filepath)) return webPath; // cached

    fs.mkdirSync(dir, { recursive: true });
    for (const candidate of [orig, rawUrl]) {
        try {
            const res = await fetch(candidate);
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(filepath, buf);
            return webPath;
        } catch {
            /* try next candidate */
        }
    }
    log(`  ! failed to download image, leaving remote url: ${rawUrl.slice(0, 80)}…`);
    return rawUrl; // last resort: hotlink
}

// ---- html cleanup ---------------------------------------------------------

async function cleanHtml(rawHtml, slug) {
    const root = parse(rawHtml, { comment: false });

    // drop Substack chrome: subscribe forms, CTA buttons, paywall stubs, etc.
    root
        .querySelectorAll(
            [
                ".subscription-widget-wrap-editor",
                ".subscription-widget-wrap",
                ".subscription-widget",
                ".button-wrapper",
                ".subscribe-widget",
                ".image-link-expand",
                ".paywall",
                ".paywall-cta",
                ".poll-embed",
                ".footer",
            ].join(", "),
        )
        .forEach((el) => el.remove());

    // flatten each <figure> down to a single local <img> + caption,
    // discarding Substack's <picture>/<source srcset> hotlink soup.
    for (const fig of root.querySelectorAll("figure")) {
        const a = fig.querySelector("a.image-link") || fig.querySelector("a");
        const img = fig.querySelector("img");
        const rawUrl =
            (a && a.getAttribute("href")) || (img && img.getAttribute("src"));
        if (!rawUrl) continue;

        const localWeb = await downloadImage(rawUrl, slug);
        const alt = ((img && img.getAttribute("alt")) || "")
            .replace(/"/g, "&quot;")
            .trim();
        const cap = fig.querySelector("figcaption");
        const capHtml = cap ? cap.toString() : "";
        fig.set_content(
            `<img src="${localWeb}" alt="${alt}" loading="lazy" />${capHtml}`,
        );
    }

    // any inline images not wrapped in <figure>
    for (const img of root.querySelectorAll("img")) {
        const src = img.getAttribute("src") || "";
        if (!src.includes("substackcdn.com")) continue;
        const localWeb = await downloadImage(src, slug);
        img.setAttribute("src", localWeb);
        img.setAttribute("loading", "lazy");
        img.removeAttribute("srcset");
    }

    // Substack wraps list-item text in <p> (<li><p>…</p></li>), which renders
    // as a block under the list bullet. Unwrap so items sit inline with markers.
    for (const li of root.querySelectorAll("li")) {
        for (const p of li.querySelectorAll("p")) {
            if (p.parentNode === li) p.replaceWith(p.innerHTML);
        }
    }

    // strip leftover empty paragraphs Substack leaves around removed widgets
    root
        .querySelectorAll("p")
        .filter((p) => p.innerHTML.trim() === "")
        .forEach((p) => p.remove());

    return root.toString().trim();
}

// ---- frontmatter ----------------------------------------------------------

function toFrontmatter({ title, date, description, link }) {
    // keep the full timestamp (not just yyyy-mm-dd) so the displayed date
    // doesn't shift a day earlier in timezones behind UTC
    const iso = isNaN(date.getTime()) ? "" : date.toISOString();
    return [
        "---",
        `title: ${JSON.stringify(title)}`,
        `date: ${iso}`,
        description ? `description: ${JSON.stringify(description)}` : null,
        "tags:",
        "  - blog",
        `source: ${link}`,
        "---",
        "",
    ]
        .filter((l) => l !== null)
        .join("\n");
}

// read titles of hand-written (non-generated) blog posts so they take priority
function handWrittenTitleKeys() {
    const blogsDir = path.join(ROOT, "src/content/blogs");
    if (!fs.existsSync(blogsDir)) return new Set();
    const keys = new Set();
    for (const name of fs.readdirSync(blogsDir)) {
        if (!name.endsWith(".md") && !name.endsWith(".mdx")) continue;
        const fm = fs.readFileSync(path.join(blogsDir, name), "utf8");
        const t = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
        if (t) keys.add(titleKey(t[1]));
    }
    return keys;
}

// ---- main -----------------------------------------------------------------

async function main() {
    let xml;
    try {
        const res = await fetch(FEED_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        xml = await res.text();
    } catch (err) {
        log(`feed fetch failed (${err.message}); keeping existing posts.`);
        return; // don't fail the build over a transient network issue
    }

    const posts = parseFeed(xml);
    log(`feed has ${posts.length} post(s).`);
    if (posts.length >= 18) {
        log(
            "feed is near Substack's ~20-post cap — older posts may be missing; consider a one-time Substack export for the full archive.",
        );
    }

    const skipKeys = handWrittenTitleKeys();
    fs.mkdirSync(OUT_DIR, { recursive: true });

    let written = 0;
    let skipped = 0;
    for (const post of posts) {
        if (skipKeys.has(titleKey(post.title))) {
            log(`- skip "${post.title}" (hand-written copy exists)`);
            skipped++;
            continue;
        }
        const body = await cleanHtml(post.html, post.slug);
        const file = path.join(OUT_DIR, `${post.slug}.md`);
        fs.writeFileSync(file, toFrontmatter(post) + body + "\n", "utf8");
        log(`✓ ${post.slug}.md`);
        written++;
    }

    log(`done: ${written} written, ${skipped} skipped.`);
}

main().catch((err) => {
    log("unexpected error:", err);
    process.exitCode = 1;
});
