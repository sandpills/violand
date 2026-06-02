<script>
    const WORKER_URL = "https://guest.viola-9ee.workers.dev"; // Your actual URL

    let name = "";
    let message = "";
    let favoriteColor = "#ff6b9d";
    let url = "";
    let honeypot = "";
    let submitting = false;
    let status = ""; // 'success' or 'error'
    let errorMsg = "";

    async function handleSubmit(e) {
        e.preventDefault();
        submitting = true;
        status = "";

        console.log("Submitting...", { name, message, favoriteColor, url });

        try {
            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    message,
                    favoriteColor,
                    url,
                    honeypot,
                }),
            });

            console.log("Response status:", response.status);

            const data = await response.json();
            console.log("Response data:", data);

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit");
            }

            status = "success";
            name = message = url = "";
            favoriteColor = "#ff6b9d";

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                status = "";
            }, 3000);
        } catch (error) {
            console.error("Submit error:", error);
            status = "error";
            errorMsg = error.message;
        }

        submitting = false;
    }
</script>

<form on:submit={handleSubmit}>
    <input
        type="text"
        name="website"
        bind:value={honeypot}
        style="display:none"
    />

    <input type="text" bind:value={name} placeholder="Name" required />
    <textarea bind:value={message} placeholder="Message" required></textarea>
    <input type="color" bind:value={favoriteColor} />
    <input type="url" bind:value={url} placeholder="Your URL (optional)" />

    <button disabled={submitting}>
        {submitting ? "Submitting..." : "Sign"}
    </button>

    {#if status === "success"}
        <p style="color: green;">Thanks for signing! ✨</p>
    {/if}

    {#if status === "error"}
        <p style="color: red;">Error: {errorMsg}</p>
    {/if}
</form>
