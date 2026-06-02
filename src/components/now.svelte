<script>
    import { onMount } from "svelte";
    import { renderInline } from "../utils/minimd";

    // Same worker that fronts the guestbook Airtable base, but the /now route
    // reads a separate "Now" table. Reads are public; writes need a token
    // (handled by the iOS Shortcut, not here).
    const WORKER_URL = "https://guest.viola-9ee.workers.dev/now";

    let entries = [];
    let loading = true;
    let failed = false;

    onMount(async () => {
        try {
            const res = await fetch(WORKER_URL);
            const data = await res.json();
            entries = (data.records || []).sort(
                (a, b) => new Date(b.createdTime) - new Date(a.createdTime),
            );
        } catch (error) {
            console.error("Failed to load /now:", error);
            failed = true;
        }
        loading = false;
    });

    // todos -> checklist; logs -> timeline. status/mind live on the homepage.
    $: todos = entries.filter((e) => (e.fields.Tag || "").toLowerCase() === "todo");
    $: feed = entries.filter((e) => (e.fields.Tag || "").toLowerCase() === "log");

    function fmt(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
        });
    }
</script>

<div class="now">
    {#if loading}
        <p class="muted">loading…</p>
    {:else if failed}
        <p class="muted">couldn't load right now — try again later.</p>
    {:else}
        {#if todos.length}
            <ul class="todos">
                {#each todos as t}
                    <li class:done={t.fields.Done}>
                        <span class="box">{t.fields.Done ? "☑" : "☐"}</span>
                        <span class="text">{@html renderInline(t.fields.Text)}</span>
                    </li>
                {/each}
            </ul>
        {/if}

        {#if feed.length}
            <ul class="feed">
                {#each feed as e}
                    <li>
                        <span class="date">{fmt(e.createdTime)}</span>
                        <span class="text">{@html renderInline(e.fields.Text)}</span>
                        {#if e.fields.City}
                            <span class="city">· {e.fields.City}</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}

        {#if !todos.length && !feed.length}
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

    .todos li {
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
        margin-bottom: 0.4rem;
    }

    .todos li.done .text {
        text-decoration: line-through;
        opacity: 0.5;
    }

    .box {
        flex: none;
    }

    .feed li {
        display: block;
        margin-bottom: 0.6rem;
    }

    .date {
        font-style: italic;
        opacity: 0.6;
        margin-right: 0.5rem;
    }

    .city {
        opacity: 0.55;
    }

    .muted {
        opacity: 0.55;
        font-style: italic;
    }
</style>
