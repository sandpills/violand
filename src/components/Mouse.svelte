<script>
    import { onMount } from "svelte";

    let mouseX = 1;
    let mouseY = 1;
    let isReady = false;

    function handleMouseMove(event) {
        // Direct linear movement - no animation, no smoothing
        mouseX = event.clientX;
        mouseY = event.clientY;
    }

    onMount(() => {
        const handleFirstMove = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            isReady = true;
            window.removeEventListener("mousemove", handleFirstMove);
        };
        window.addEventListener("mousemove", handleFirstMove, { once: true });

        return () => {
            window.removeEventListener("mousemove", handleFirstMove);
        };
    });
</script>

<svelte:window on:mousemove={handleMouseMove} />

<div
    class="custom-cursor"
    class:ready={isReady}
    style="left: {mouseX}px; top: {mouseY}px;"
/>

<style>
    .custom-cursor {
        position: fixed;
        width: 10px;
        height: 10px;
        background-color: blue;
        pointer-events: none;
        transform: translate(-50%, -50%);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.1s;
    }

    .custom-cursor.ready {
        opacity: 1;
    }
</style>
