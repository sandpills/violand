<script>
    import { onMount } from "svelte";

    const WORKER_URL = "https://guest.viola-9ee.workers.dev";

    let entries = [];
    let loading = true;

    onMount(async () => {
        try {
            const response = await fetch(WORKER_URL);
            const data = await response.json();
            entries = data.records || [];
            console.log("Loaded entries:", entries);
        } catch (error) {
            console.error("Failed to load:", error);
        }
        loading = false;
    });
</script>

{#if loading}
    <p>Loading entries...</p>
{:else if entries.length === 0}
    <p>No entries yet. Be the first to sign!</p>
{:else}
    <div class="guestbook-entries">
        {#each entries as entry}
            <div
                class="entry"
                style="border-left: 4px solid {entry.fields['Favorite Color']}"
            >
                <div class="entry-header">
                    <strong>{entry.fields.Name}</strong>
                    {#if entry.fields.URL}
                        <a
                            href={entry.fields.URL}
                            target="_blank"
                            rel="noopener">🔗</a
                        >
                    {/if}
                </div>
                <p>{entry.fields.Message}</p>
                <small>{new Date(entry.createdTime).toLocaleDateString()}</small
                >
            </div>
        {/each}
    </div>
{/if}

<style>
    .guestbook-entries {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .entry {
        padding: 1rem;
        background: #f9f9f9;
        border-radius: 4px;
    }

    .entry-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .entry p {
        margin: 0.5rem 0;
    }

    .entry small {
        color: #666;
    }
</style>
