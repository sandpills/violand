<script>
    import { onMount } from "svelte";
    import okImage from "/ok.png";
    let x = 0;
    let y = 0;
    let trails = [];

    function updateMouse(event) {
        x = event.clientX;
        y = event.clientY;

        trails = [...trails, { x, y, id: Date.now() }].slice(-1);
    }

    onMount(() => {
        window.addEventListener("mousemove", updateMouse);
        return () => window.removeEventListener("mousemove", updateMouse);
    });
</script>

<svelte:window on:mousemove={updateMouse} />

{#each trails as trail, i}
    <img
        class="fixed pointer-events-none transition-all duration-300"
        style="left: {trail.x}px; top: {trail.y}px; width: {(8 - i) *
            8}px; height: {(8 - i) * 8}px; opacity: {(8 - i) /
            8}; transform: translate(-50%, -50%); z-index: 9999;"
        src={okImage}
        alt=""
        draggable="false"
    />
{/each}
