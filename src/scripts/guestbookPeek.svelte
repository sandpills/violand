<script>
    import { onMount } from "svelte";
    import { bitmap, textRows, loadEntries, fmtWhen } from "./guestbookArt.js";

    export let guestbookHref = "/guestbook/";

    let entries = [];

    const refresh = async () => {
        try {
            entries = (await loadEntries()).slice(0, 5);
        } catch (error) {
            console.error("guestbook peek failed:", error);
        }
    };
    onMount(refresh);
</script>

{#if entries.length}
    <ul class="peek-list">
        {#each entries as e (e.id)}
            {@const when = fmtWhen(e.date)}
            <li>
                <a class="peek-row" href={`${guestbookHref}#gb-${e.id}`}>
                    <span class="peek-swatch" style={`background:${e.color}`}
                    ></span>
                    {#if e.art && e.art.px !== undefined}
                        <span class="peek-thumb noisy-image">
                            <canvas class="peek-canvas" use:bitmap={e.art}
                            ></canvas>
                            {#if e.art.txt}
                                <span
                                    class="peek-tlayer"
                                    style={`--tc:${e.art.tc};--tr:${e.art.tr};`}
                                >
                                    {#each textRows(e.art) as row}
                                        {#each row as ch}<span
                                                class="peek-tcell">{ch}</span
                                            >{/each}
                                    {/each}
                                </span>
                            {/if}
                        </span>
                    {:else}
                        <span class="peek-thumb"></span>
                    {/if}
                    <span class="peek-name">{e.name}</span>
                    <span class="peek-when">{when.date} {when.time}</span>
                </a>
            </li>
        {/each}
    </ul>
{/if}

<style>
    @import url("https://fonts.googleapis.com/css2?family=Silkscreen&display=swap");

    .peek-list {
        list-style: none;
        margin: 0.5rem 0 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        font-family: var(--font-mono, monospace);
    }

    @media (min-width: 769px) {
        .peek-list {
            max-height: 60vh;
            overflow-y: auto;
            scrollbar-width: none;
        }
        .peek-list::-webkit-scrollbar {
            display: none;
        }
    }

    .peek-row {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.3rem 0;
        border-bottom: 2px dotted rgb(118, 118, 118);
        font-size: 0.85rem;
        color: inherit;
        text-decoration: none;
    }

    .peek-thumb {
        position: relative;
        flex: none;
        height: 2rem;
        aspect-ratio: 96 / 64;
        background: #c7c7c7;
        border: 1px solid rgba(20, 20, 17, 0.25);
        container-type: inline-size;
    }

    .peek-canvas,
    .peek-tlayer {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
    }
    .peek-canvas {
        image-rendering: pixelated;
        image-rendering: crisp-edges;
    }
    .peek-tlayer {
        display: grid;
        grid-template-columns: repeat(var(--tc), 1fr);
        grid-template-rows: repeat(var(--tr), 1fr);
        font-family: "Silkscreen", var(--font-mono), monospace;
        font-size: 4.4cqw;
        line-height: 1;
        color: #141411;
    }
    .peek-tcell {
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: pre;
    }

    .peek-swatch {
        flex: none;
        width: 0.3rem;
        height: 2rem;
    }

    .peek-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .peek-when {
        margin-left: auto;
        font-size: 0.82rem;
        opacity: 0.5;
        white-space: nowrap;
    }
</style>
