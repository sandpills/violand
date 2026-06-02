<script>
    let clicks = 0;
    let message = "click me?";

    function handleClick() {
        clicks++;
        message = `clicked ${clicks} times!`;
    }
</script>

<button
    class="p-1 font-mono text-xs shadow-md hover:blur-sm absolute bottom-2 right-2"
    on:click={handleClick}
>
    {message}
</button>
