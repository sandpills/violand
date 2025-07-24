<script>
    let clicks = 0;
    let message = "more";

    function handleClick() {
        clicks++;
    }
</script>

<button
    class="p-1 font-mono text-xs shadow-md hover:blur-sm absolute bottom-2 right-2"
    on:click={handleClick}
>
    {more}
</button>
