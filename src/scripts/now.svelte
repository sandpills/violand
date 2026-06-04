<script>
    import { onMount } from "svelte";
    import { renderInline } from "../utils/minimd";

    const WORKER_URL = "https://guest.viola-9ee.workers.dev/now";

    let entries = [];
    let loading = true;
    let failed = false;
    let showDone = false;

    onMount(async () => {
        try {
            const res = await fetch(WORKER_URL);
            const data = await res.json();
            entries = data.records || [];
        } catch (error) {
            console.error("Failed to load /now:", error);
            failed = true;
        }
        loading = false;
    });

    const tagOf = (e) => (e.fields.Tag || "").toLowerCase();

    // open todos -> checklist at top
    $: openTodos = entries
        .filter((e) => tagOf(e) === "todo" && !e.fields.Done)
        .sort((a, b) => new Date(a.createdTime) - new Date(b.createdTime));

    // logs always show; completed todos only when "show done" is toggled on
    $: logItems = entries
        .filter((e) => tagOf(e) === "log")
        .map((e) => ({
            key: e.id,
            when: e.createdTime,
            text: e.fields.Text,
            city: e.fields.City,
            kind: "log",
        }));

    $: doneItems = entries
        .filter((e) => tagOf(e) === "todo" && e.fields.Done)
        .map((e) => ({
            key: e.id,
            when: e.fields["Done At"] || e.createdTime,
            text: e.fields.Text,
            kind: "done",
        }));

    // stream interleaved by time, newest first
    $: stream = [...logItems, ...(showDone ? doneItems : [])].sort(
        (a, b) => new Date(b.when) - new Date(a.when),
    );

    function fmt(iso) {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    }

    // todo with a Due date
    function dueInfo(iso) {
        if (!iso) return null;
        const m = String(iso)
            .slice(0, 10)
            .match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        const due = new Date(+m[1], +m[2] - 1, +m[3]);
        const now = new Date();
        const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const days = Math.round((due - t0) / 86400000);
        const label = due.toLocaleString(undefined, {
            month: "short",
            day: "numeric",
        });
        return { label, days, overdue: days < 0, soon: days >= 0 && days <= 7 };
    }

    function getToken() {
        let t = localStorage.getItem("now_token");
        if (!t) {
            t = (prompt("are you viola???") || "").trim();
            if (t) localStorage.setItem("now_token", t);
        }
        return t;
    }

    async function markDone(rec) {
        const token = getToken();
        if (!token) return;

        const prev = rec.fields.Done;
        // optimistic: move it into the stream right away
        rec.fields.Done = true;
        rec.fields["Done At"] = new Date().toISOString();
        entries = [...entries];

        try {
            const res = await fetch(WORKER_URL, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: rec.id,
                    fields: { Done: true, "Done At": rec.fields["Done At"] },
                }),
            });
            if (res.status === 401) {
                localStorage.removeItem("now_token");
                rec.fields.Done = prev;
                entries = [...entries];
                alert("no you're not");
                return;
            }
            if (!res.ok) throw new Error("request failed");
        } catch (e) {
            rec.fields.Done = prev;
            entries = [...entries];
            alert("couldn't check off — try again");
        }
    }
</script>

<div class="now">
    {#if loading}
        <p class="muted">loading…</p>
    {:else if failed}
        <p class="muted">couldn't load right now — try again later.</p>
    {:else}
        {#if doneItems.length}
            <div class="controls">
                <button class="toggle" on:click={() => (showDone = !showDone)}>
                    {showDone ? "hide done" : `show done (${doneItems.length})`}
                </button>
            </div>
        {/if}

        {#if openTodos.length}
            <ul class="todos">
                {#each openTodos as t (t.id)}
                    {@const di = dueInfo(t.fields.Due)}
                    <li>
                        <button
                            class="box"
                            on:click={() => markDone(t)}
                            aria-label="check off"
                            title="check off">[ ]</button
                        >
                        <span class="text"
                            >{@html renderInline(t.fields.Text)}</span
                        >
                        {#if di}
                            <span
                                class="due"
                                class:overdue={di.overdue}
                                class:soon={di.soon}
                                >~ {di.label}{di.overdue
                                    ? ` (${-di.days}d ago)`
                                    : di.days === 0
                                      ? "~ today"
                                      : ""}</span
                            >
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}

        {#if stream.length}
            <ul class="feed">
                {#each stream as item (item.key)}
                    <li class:done={item.kind === "done"}>
                        <span class="date">{fmt(item.when)}</span>
                        {#if item.kind === "done"}
                            <span class="check">✓</span>
                        {/if}
                        <span class="text">{@html renderInline(item.text)}</span
                        >
                        {#if item.city}
                            <span class="city">· {item.city}</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}

        {#if !openTodos.length && !logItems.length && !doneItems.length}
            <p class="muted">nothing here yet.</p>
        {/if}
    {/if}
</div>

<style>
    .now {
        font-family: var(--font-mono, monospace);
        font-size: 0.95rem;
        line-height: 1.6;
        max-width: 42rem;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0 0 2rem 0;
    }

    .controls {
        margin-bottom: 1.25rem;
    }

    .toggle {
        font: inherit;
        font-size: 0.8rem;
        font-style: italic;
        background: none;
        border: 1px dotted rgb(118, 118, 118);
        padding: 0.1rem 0.2rem;
        color: inherit;
        cursor: pointer;
        opacity: 0.7;
    }

    .toggle:hover {
        opacity: 1;
    }

    .todos li {
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
        margin-bottom: 0.4rem;
    }

    /* checkbox */
    button.box {
        flex: none;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        transition: opacity 0.1s;
    }

    button.box:hover {
        opacity: 0.55;
    }

    .feed li {
        display: block;
        margin-bottom: 0.6rem;
    }

    .feed li.done .text {
        text-decoration: line-through;
        opacity: 0.6;
    }

    .date {
        font-style: italic;
        opacity: 0.6;
        margin-right: 0.5rem;
    }

    .check {
        color: var(--color-blue-text);
        margin-right: 0.25rem;
    }

    :global(html.dark) .check {
        color: var(--color-dark-text);
    }

    .city {
        opacity: 0.55;
    }

    .due {
        margin-left: 0.3rem;
        /* font-size: 0.86em; */
        font-style: italic;
        opacity: 0.6;
    }

    .due.soon {
        color: #324e7e;
        opacity: 0.85;
    }

    .due.overdue {
        color: #0037ff;
        opacity: 0.9;
    }

    .muted {
        opacity: 0.55;
        font-style: italic;
    }
</style>
