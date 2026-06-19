// Shared guestbook helpers

export const WORKER_URL = "https://guest.viola-9ee.workers.dev";

export function parseArt(raw) {
    if (!raw) return null;
    try {
        const a = JSON.parse(raw);
        if (a && a.v && a.px !== undefined) return a;
    } catch (_) { }
    return { legacy: String(raw) }; // older / plain-text entries
}

function unpackBits(b64, len) {
    const s = atob(b64);
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        const b = s.charCodeAt(i >> 3) || 0;
        arr[i] = (b >> (7 - (i & 7))) & 1;
    }
    return arr;
}

// paint a stored 1-bit bitmap onto a <canvas>.
export function bitmap(node, art) {
    const draw = (a) => {
        node.width = a.w;
        node.height = a.h;
        const ctx = node.getContext("2d");
        const img = ctx.createImageData(a.w, a.h);
        const px = unpackBits(a.px, a.w * a.h);
        for (let i = 0; i < px.length; i++) {
            if (px[i]) {
                const o = i * 4;
                img.data[o] = 20;
                img.data[o + 1] = 20;
                img.data[o + 2] = 17;
                img.data[o + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    };
    draw(art);
    return { update: draw };
}

// pad the stored text layer back into a tc x tr grid of single chars
export function textRows(art) {
    const lines = (art.txt || "").split("\n");
    const rows = [];
    for (let r = 0; r < art.tr; r++) {
        const line = lines[r] || "";
        const row = [];
        for (let c = 0; c < art.tc; c++) row.push(line[c] || " ");
        rows.push(row);
    }
    return rows;
}

export async function loadEntries() {
    const res = await fetch(WORKER_URL);
    const data = await res.json();
    return (data.records || []).map((rec) => ({
        id: rec.id,
        name: rec.fields.Name || "anon",
        message: rec.fields.Message || "",
        color: rec.fields["Favorite Color"] || "#2e00fd",
        art: parseArt(rec.fields.Art),
        date: rec.createdTime,
    }));
}

export function fmtWhen(iso) {
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString([], {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
        }),
        time: d.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }),
    };
}
