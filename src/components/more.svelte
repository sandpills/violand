---
import Box from "../layouts/Box.astro";
---

<script>
    let clicks = 0;
    let message = "more";

    function handleClick() {
        clicks++;
    }
</script>

<Box  class="p-1 font-mono text-xs shadow-md hover:blur-sm absolute bottom-2 right-2"
on:click={handleClick}>

</Box>
    {more}
