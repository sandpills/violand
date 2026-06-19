<script>
    import { onMount, onDestroy } from "svelte";
    import { bitmap, textRows, loadEntries, fmtWhen } from "./guestbookArt.js";

    let entries = [];
    let loading = true;
    let selected = null;

    async function load() {
        try {
            entries = await loadEntries();
        } catch (error) {
            console.error("guestbook load failed:", error);
        }
        loading = false;
        openFromHash();
    }

    function openFromHash() {
        if (typeof window === "undefined") return;
        const m = /^#gb-(.+)$/.exec(window.location.hash);
        if (!m) return;
        const found = entries.find((e) => e.id === m[1]);
        if (found) selected = found;
    }

    function open(e) {
        selected = e;
    }
    function close() {
        selected = null;
        if (
            typeof window !== "undefined" &&
            window.location.hash.startsWith("#gb-")
        ) {
            history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search,
            );
        }
    }
    function onWindowKey(e) {
        if (e.key === "Escape" && selected) close();
    }

    const refresh = () => load();
    onMount(() => {
        load();
        window.addEventListener("guestbook:signed", refresh);
        window.addEventListener("hashchange", openFromHash);
    });
    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("guestbook:signed", refresh);
            window.removeEventListener("hashchange", openFromHash);
            document.body.style.overflow = "";
        }
    });

    $: if (typeof document !== "undefined")
        document.body.style.overflow = selected ? "hidden" : "";
    $: selectedWhen = selected ? fmtWhen(selected.date) : null;
</script>

<svelte:window on:keydown={onWindowKey} />

<div class="gb-wall">
    {#if loading}
        <p class="gb-wall-msg">unpinning the wall…</p>
    {:else if entries.length === 0}
        <p class="gb-wall-msg">nobody's here yet..</p>
    {:else}
        <div class="gb-grid-wall">
            {#each entries as e (e.id)}
                {@const when = fmtWhen(e.date)}
                <figure class="gb-card" style={`--tape:${e.color}`}>
                    <button
                        type="button"
                        class="gb-card-hit"
                        on:click={() => open(e)}
                        aria-label={`open ${e.name}'s entry`}
                    ></button>
                    <span class="gb-tape" aria-hidden="true"></span>
                    {#if e.art && e.art.px !== undefined}
                        <div class="gb-card-art">
                            <canvas class="gb-card-canvas" use:bitmap={e.art}
                            ></canvas>
                            {#if e.art.txt}
                                <div
                                    class="gb-tlayer"
                                    style={`--tc:${e.art.tc};--tr:${e.art.tr};`}
                                >
                                    {#each textRows(e.art) as row}
                                        {#each row as ch}<span class="gb-tcell"
                                                >{ch}</span
                                            >{/each}
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {:else if e.art && e.art.legacy}
                        <pre class="gb-card-pre">{e.art.legacy}</pre>
                    {/if}
                    <figcaption class="gb-card-cap">
                        <div class="gb-card-byline">
                            <span class="gb-card-name">{e.name}</span>
                            <time class="gb-card-date"
                                >{when.date} {when.time}</time
                            >
                        </div>
                        {#if e.message}<span class="gb-card-msg"
                                >{e.message}</span
                            >{/if}
                    </figcaption>
                </figure>
            {/each}
        </div>
    {/if}
</div>

{#if selected}
    <div class="gb-modal" role="presentation">
        <button
            type="button"
            class="gb-modal-backdrop"
            on:click={close}
            aria-label="close"
        ></button>
        <div
            class="gb-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name}'s guestbook entry`}
        >
            <figure class="gb-polaroid" style={`--tape:${selected.color}`}>
                <span class="gb-tape" aria-hidden="true"></span>
                <!-- <button
                    type="button"
                    class="gb-modal-close"
                    on:click={close}
                    aria-label="close">✕</button
                > -->
                {#if selected.art && selected.art.px !== undefined}
                    <div class="gb-card-art gb-polaroid-art">
                        <canvas class="gb-card-canvas" use:bitmap={selected.art}
                        ></canvas>
                        {#if selected.art.txt}
                            <div
                                class="gb-tlayer"
                                style={`--tc:${selected.art.tc};--tr:${selected.art.tr};`}
                            >
                                {#each textRows(selected.art) as row}
                                    {#each row as ch}<span class="gb-tcell"
                                            >{ch}</span
                                        >{/each}
                                {/each}
                            </div>
                        {/if}
                    </div>
                {:else if selected.art && selected.art.legacy}
                    <pre class="gb-card-pre">{selected.art.legacy}</pre>
                {/if}
                <figcaption class="gb-card-cap gb-polaroid-cap">
                    <div class="gb-card-byline">
                        <span class="gb-card-name">{selected.name}</span>
                        {#if selectedWhen}
                            <time class="gb-card-date"
                                >{selectedWhen.date} {selectedWhen.time}</time
                            >
                        {/if}
                    </div>
                    {#if selected.message}<span class="gb-card-msg"
                            >{selected.message}</span
                        >{/if}
                </figcaption>
            </figure>
        </div>
    </div>
{/if}
