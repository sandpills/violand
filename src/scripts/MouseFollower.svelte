<script>
    import { onMount, onDestroy } from "svelte";
    import { getLinkHref } from "../utils/paths.ts";
    const okUrl = getLinkHref("ok.png");

    export let enabled = false;

    let mouseX = 0;
    let mouseY = 0;
    let trail = [];
    let container;
    let trailTimer;
    let mouseMoveHandler;

    const maxTrailLength = 500; // too long is problem
    const trailDelay = 20;
    const marqueeCol = 11;

    const startTracking = () => {
        // Reset everything
        trail = [];
        mouseX = 0;
        mouseY = 0;

        mouseMoveHandler = (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const updateTrail = () => {
            if (enabled) {
                trail = [
                    {
                        x: mouseX,
                        y: mouseY,
                        id: Date.now(),
                    },
                    ...trail.slice(0, maxTrailLength - 1),
                ];
            }
        };
        console.log("tracking!!!!!");

        // Start listeners and timer
        document.addEventListener("mousemove", mouseMoveHandler);
        trailTimer = setInterval(updateTrail, trailDelay);
    };

    // Function to stop the mouse tracking
    const stopTracking = () => {
        if (mouseMoveHandler) {
            document.removeEventListener("mousemove", mouseMoveHandler);
            mouseMoveHandler = null;
        }

        if (trailTimer) {
            clearInterval(trailTimer);
            trailTimer = null;
        }

        // Clear the trail
        trail = [];
    };

    $: if (enabled) {
        startTracking();
    } else {
        stopTracking();
    }

    onMount(() => {
        const handleToggleEvent = (event) => {
            enabled = event.detail.enabled;
        };

        window.addEventListener("okToggle", handleToggleEvent);

        onDestroy(() => {
            stopTracking();
        });

        return () => {
            window.removeEventListener("okToggle", handleToggleEvent);
        };
    });
</script>

{#if enabled}
    <div class="ok-container" bind:this={container}>
        {#each trail.slice().reverse() as trailPoint, index (trailPoint.id)}
            <img
                src={okUrl}
                alt="ok"
                class="trail-image"
                style="
          left: {trailPoint.x}px; 
          top: {trailPoint.y}px;
          opacity: {1 - ((trail.length - 1 - index) / trail.length) * 0.1};
          transform: translate(-50%, -50%);
          z-index: {1 + index};
        "
            />
        {/each}

        <section class="ok-marquee-section">
            <div class="ok-marquee-wrapper">
                <ul class="marquee1">
                    {#each Array(marqueeCol) as _}
                        <li class="ok-scroll">
                            <img src={okUrl} alt="ok" />
                        </li>
                    {/each}
                </ul>
                <ul class="marquee2">
                    {#each Array(marqueeCol) as _}
                        <li class="ok-scroll">
                            <img src={okUrl} alt="ok" />
                        </li>
                    {/each}
                </ul>
            </div>
        </section>
    </div>
{/if}

<style>
    .ok-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        /* overflow: hidden; */
    }

    .trail-image {
        position: absolute;
        width: 80px;
        height: 80px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        user-select: none;
    }

    /* .ok-scroll {
        width: 80px;
        height: 80px;
    } */

    .trail-image {
        /* z-index: 1; */
        transition: opacity 0.1s ease-out;
    }

    .ok-marquee-section {
        overflow: hidden;
        white-space: nowrap;
        width: 90px;
        height: 100vh;
        display: flex;
    }

    .ok-marquee-wrapper {
        position: relative;
    }

    ul {
        display: flex;
        flex-direction: column;
        list-style: none;
        padding: none;
    }

    li {
        width: 80px;
        height: 80px;
        margin: 4.6px;
    }

    .marquee1 {
        animation: marquee1 8s linear infinite;
    }

    .marquee2 {
        animation: marquee2 8s linear infinite;
        position: absolute;
        top: 0;
    }

    @keyframes marquee1 {
        from {
            transform: translateY(0%);
        }
        to {
            transform: translateY(-100%);
        }
    }

    @keyframes marquee2 {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0%);
        }
    }
</style>
