// Frontmatter dates come in three precisions for arrangement:
//   date: 2022           (bare year   -> YAML number)
//   date: 2023-05        (year-month  -> YAML string)
//   date: 2025-08-26     (full date   -> YAML Date)
// We sort by the full value but only ever display the year. `getEntryDate`
// normalizes any of these (preferring `date`, falling back to legacy `year`).

export interface EntryDate {
    date: Date | null; // normalized to local midnight; drives sorting/arrangement
    year: number | null; // just the year, for display
    time: number; // epoch ms for sorting (0 when unknown)
}

export function getEntryDate(data: { date?: unknown; year?: unknown }): EntryDate {
    const norm = normalize(data.date) ?? normalize(data.year);
    if (!norm) return { date: null, year: null, time: 0 };
    return { ...norm, time: norm.date.getTime() };
}

function normalize(val: unknown): { date: Date; year: number } | null {
    if (val == null || val === "") return null;

    let y: number;
    let mo = 1;
    let d = 1;

    if (val instanceof Date) {
        // YAML parses full dates as UTC midnight; read UTC parts so the year
        // and month don't drift across timezones
        y = val.getUTCFullYear();
        mo = val.getUTCMonth() + 1;
        d = val.getUTCDate();
    } else {
        const m = String(val)
            .trim()
            .match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/);
        if (!m) return null;
        y = Number(m[1]);
        mo = m[2] ? Number(m[2]) : 1;
        d = m[3] ? Number(m[3]) : 1;
    }

    if (!Number.isFinite(y)) return null;
    // build in local time so getFullYear()/display stays on the intended year
    return { date: new Date(y, mo - 1, d), year: y };
}
