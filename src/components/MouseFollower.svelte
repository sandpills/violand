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
    const marqueeCol = 20;

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
    <div class="container" bind:this={container}>
        {#each trail as trailPoint, index (trailPoint.id)}
            <img
                src={okUrl}
                alt="ok"
                class="trail-image"
                style="
          left: {trailPoint.x}px; 
          top: {trailPoint.y}px;
          opacity: {1 - (index / trail.length) * 0.1};
          transform: translate(-50%, -50%);
        "
            />
        {/each}

        <img
            src={okUrl}
            alt="ok"
            class="main-image"
            style="left: {mouseX}px; top: {mouseY}px;"
        />

        {#each Array(marqueeCol) as _}
            <marquee behavior="scroll" direction="down" class="container">
                {#each Array(marqueeCol) as _}
                    <img src={okUrl} alt="ok" class="ok-scroll" />
                {/each}
            </marquee>
        {/each}
    </div>
{/if}

<style>
    .container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        /* overflow: hidden; */
    }

    .main-image,
    .trail-image {
        position: absolute;
        width: 80px;
        height: 80px;
        transform: translate(-50%, -50%);
        pointer-events: none;
        user-select: none;
    }

    .ok-scroll {
        width: 70px;
        height: 70px;
    }

    .main-image {
        z-index: 10;
    }

    .trail-image {
        z-index: 1;
        transition: opacity 0.1s ease-out;
    }
</style>
