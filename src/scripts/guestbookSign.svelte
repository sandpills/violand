<script>
    import { onMount, onDestroy } from "svelte";

    // A tiny 1-bit pixel drawing card. Two tools on one canvas:
    //   • draw — pixel pen (solid / dither fills / spray airbrush) + eraser
    //   • type — drop ascii characters anywhere (a separate text layer)
    // Both serialize to ONE compact text blob (packed bitmap + text grid), so
    // the guestbook backend stays text-only — no image hosting needed.
    const WORKER_URL = "https://guest.viola-9ee.workers.dev";

    const W = 96; // pixel canvas resolution
    const H = 64;
    const TC = 25; // text layer columns / rows, overlaid on the canvas
    const TR = 10;
    const SIZES = [1, 2, 4];

    // just a solid pen — the spray brush is the only textured effect.
    const PATTERNS = [
        {
            name: "pen",
            glyph: "█",
            m: [
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
                [1, 1, 1, 1],
            ],
        },
    ];

    let pixels = new Uint8Array(W * H);
    let text = blankText();
    let history = [];

    let mode = "draw"; // 'draw' | 'type'
    let tool = "pen"; // 'pen' | 'spray'
    let pat = 0;
    let size = 2;
    let erasing = false;
    let painting = false;
    let typing = false;
    let curR = 0;
    let curC = 0;

    let name = "";
    let message = "";
    let favoriteColor = "#2e00fd";
    let honeypot = "";
    let submitting = false;
    let status = "";
    let errorMsg = "";

    let canvasEl;
    let wrapEl;
    let keyEl; // hidden input — captures typing (incl. mobile keyboards)
    let ctx;
    let sprayTimer = null;
    let lastG = { x: 0, y: 0 };

    function blankText() {
        return Array.from({ length: TR }, () =>
            Array.from({ length: TC }, () => " "),
        );
    }

    onMount(() => {
        ctx = canvasEl.getContext("2d");
        redraw();
    });
    onDestroy(() => stopSpray());

    function redraw() {
        if (!ctx) return;
        const img = ctx.createImageData(W, H);
        for (let i = 0; i < pixels.length; i++) {
            if (pixels[i]) {
                const o = i * 4;
                img.data[o] = 20;
                img.data[o + 1] = 20;
                img.data[o + 2] = 17;
                img.data[o + 3] = 255;
            }
        }
        ctx.putImageData(img, 0, 0);
    }

    // ---- pixel pen -------------------------------------------------------
    function inkAt(x, y) {
        return PATTERNS[pat].m[((y % 4) + 4) % 4][((x % 4) + 4) % 4];
    }
    function stamp(gx, gy, erase) {
        const half = Math.floor(size / 2);
        for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
                const x = gx - half + dx;
                const y = gy - half + dy;
                if (x < 0 || x >= W || y < 0 || y >= H) continue;
                pixels[y * W + x] = erase ? 0 : inkAt(x, y);
            }
        }
    }
    // airbrush: scatter pixels in a disc — denser the longer you dwell
    function spray(gx, gy) {
        const r = size + 3;
        const count = 3 + size * 2;
        for (let k = 0; k < count; k++) {
            const a = Math.random() * 6.2832;
            const d = Math.sqrt(Math.random()) * r;
            const x = Math.round(gx + Math.cos(a) * d);
            const y = Math.round(gy + Math.sin(a) * d);
            if (x < 0 || x >= W || y < 0 || y >= H) continue;
            pixels[y * W + x] = 1;
        }
    }
    function applyAt(gx, gy) {
        if (erasing) stamp(gx, gy, true);
        else if (tool === "spray") spray(gx, gy);
        else stamp(gx, gy, false);
    }
    function startSpray() {
        if (sprayTimer) return;
        sprayTimer = setInterval(() => {
            if (!painting) return;
            spray(lastG.x, lastG.y);
            redraw();
        }, 55);
    }
    function stopSpray() {
        if (sprayTimer) {
            clearInterval(sprayTimer);
            sprayTimer = null;
        }
    }
    function eventToPixel(e) {
        const r = canvasEl.getBoundingClientRect();
        const gx = Math.floor(((e.clientX - r.left) / r.width) * W);
        const gy = Math.floor(((e.clientY - r.top) / r.height) * H);
        return { gx, gy };
    }
    function onCanvasDown(e) {
        if (mode !== "draw") return;
        e.preventDefault();
        snapshot();
        painting = true;
        const { gx, gy } = eventToPixel(e);
        lastG = { x: gx, y: gy };
        applyAt(gx, gy);
        if (tool === "spray" && !erasing) startSpray();
        redraw();
    }
    function onCanvasMove(e) {
        if (!painting) return;
        const { gx, gy } = eventToPixel(e);
        lastG = { x: gx, y: gy };
        applyAt(gx, gy);
        redraw();
    }
    function stopPainting() {
        stopSpray();
        painting = false;
    }

    // ---- type tool -------------------------------------------------------
    function cellFromEvent(e) {
        const r = wrapEl.getBoundingClientRect();
        const c = Math.min(
            TC - 1,
            Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * TC)),
        );
        const rr = Math.min(
            TR - 1,
            Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * TR)),
        );
        return { c, rr };
    }
    function onLayerDown(e) {
        if (mode !== "type") return;
        e.preventDefault();
        const { c, rr } = cellFromEvent(e);
        curC = c;
        curR = rr;
        if (e.pointerType === "touch")
            keyEl && keyEl.focus({ preventScroll: true });
        else wrapEl && wrapEl.focus({ preventScroll: true });
    }
    function setChar(r, c, ch) {
        if (r < 0 || r >= TR || c < 0 || c >= TC) return;
        text[r][c] = ch;
        text = text;
    }
    function advance() {
        curC += 1;
        if (curC >= TC) {
            curC = 0;
            curR = Math.min(TR - 1, curR + 1);
        }
    }
    function typeChar(ch) {
        snapshot();
        setChar(curR, curC, ch);
        advance();
    }
    function backspace() {
        snapshot();
        curC = Math.max(0, curC - 1);
        setChar(curR, curC, " ");
    }
    function onKeyDown(e) {
        if (mode !== "type") return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key;
        if (k === "ArrowRight") {
            curC = Math.min(TC - 1, curC + 1);
            e.preventDefault();
            return;
        }
        if (k === "ArrowLeft") {
            curC = Math.max(0, curC - 1);
            e.preventDefault();
            return;
        }
        if (k === "ArrowDown") {
            curR = Math.min(TR - 1, curR + 1);
            e.preventDefault();
            return;
        }
        if (k === "ArrowUp") {
            curR = Math.max(0, curR - 1);
            e.preventDefault();
            return;
        }
        if (k === "Enter") {
            curC = 0;
            curR = Math.min(TR - 1, curR + 1);
            e.preventDefault();
            return;
        }
        if (k === "Backspace") {
            backspace();
            e.preventDefault();
            return;
        }
        if (k.length === 1) {
            typeChar(k);
            e.preventDefault();
        }
    }
    function onKeyInput(e) {
        if (mode !== "type") return;
        if (e.inputType === "insertText" && e.data) {
            for (const ch of e.data) typeChar(ch);
        } else if (e.inputType === "deleteContentBackward") {
            backspace();
        }
        if (keyEl) keyEl.value = "";
    }

    // ---- history / clear -------------------------------------------------
    function snapshot() {
        history.push({ px: pixels.slice(), tx: text.map((r) => r.slice()) });
        if (history.length > 60) history.shift();
        history = history;
    }
    function undo() {
        const prev = history.pop();
        if (!prev) return;
        pixels = prev.px;
        text = prev.tx;
        history = history;
        redraw();
    }
    function clearAll() {
        snapshot();
        pixels = new Uint8Array(W * H);
        text = blankText();
        curR = curC = 0;
        redraw();
    }

    function setMode(m) {
        mode = m;
        if (m === "type")
            setTimeout(
                () => wrapEl && wrapEl.focus({ preventScroll: true }),
                0,
            );
    }

    // ---- serialize -------------------------------------------------------
    function packBits(arr) {
        const bytes = new Uint8Array(Math.ceil(arr.length / 8));
        for (let i = 0; i < arr.length; i++)
            if (arr[i]) bytes[i >> 3] |= 128 >> (i & 7);
        let s = "";
        for (let i = 0; i < bytes.length; i++)
            s += String.fromCharCode(bytes[i]);
        return btoa(s);
    }
    function textString() {
        return text
            .map((r) => r.join("").replace(/\s+$/, ""))
            .join("\n")
            .replace(/\n+$/, "");
    }
    function isEmpty() {
        if (textString() !== "") return false;
        for (let i = 0; i < pixels.length; i++) if (pixels[i]) return false;
        return true;
    }
    function serialize() {
        if (isEmpty()) return "";
        return JSON.stringify({
            v: 1,
            w: W,
            h: H,
            tc: TC,
            tr: TR,
            px: packBits(pixels),
            txt: textString(),
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) {
            status = "error";
            errorMsg = "tell me your name :)";
            return;
        }
        if (!message.trim() && isEmpty()) {
            status = "error";
            errorMsg = "draw something or leave a note!";
            return;
        }
        submitting = true;
        status = "";
        try {
            const response = await fetch(WORKER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    message,
                    favoriteColor,
                    art: serialize(),
                    honeypot,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit");
            status = "success";
            name = message = "";
            favoriteColor = "#2e00fd";
            pixels = new Uint8Array(W * H);
            text = blankText();
            history = [];
            curR = curC = 0;
            redraw();
            window.dispatchEvent(new CustomEvent("guestbook:signed"));
            setTimeout(() => {
                if (status === "success") status = "";
            }, 4000);
        } catch (error) {
            status = "error";
            errorMsg = error.message;
        }
        submitting = false;
    }
</script>

<svelte:window on:pointerup={stopPainting} />

<form class="gb-sign" on:submit={handleSubmit}>
    <input
        type="text"
        name="website"
        bind:value={honeypot}
        class="gb-honeypot"
        tabindex="-1"
        autocomplete="off"
    />

    <div class="gb-window">
        <div class="gb-toolbar">
            <div class="gb-modes">
                <button
                    type="button"
                    class="gb-mode pill"
                    class:active={mode === "draw"}
                    on:click={() => setMode("draw")}>draw</button
                >
                <button
                    type="button"
                    class="gb-mode pill"
                    class:active={mode === "type"}
                    on:click={() => setMode("type")}>type</button
                >
            </div>

            {#if mode === "draw"}
                <div class="gb-pats">
                    {#each PATTERNS as p, i}
                        <button
                            type="button"
                            class="gb-pat pill"
                            class:active={tool === "pen" &&
                                !erasing &&
                                pat === i}
                            on:click={() => {
                                tool = "pen";
                                pat = i;
                                erasing = false;
                            }}
                            title={p.name}
                            aria-label={p.name}>{p.glyph}</button
                        >
                    {/each}
                    <button
                        type="button"
                        class="gb-pat pill"
                        class:active={tool === "spray" && !erasing}
                        on:click={() => {
                            tool = "spray";
                            erasing = false;
                        }}
                        title="spray"
                        aria-label="spray">⠿</button
                    >
                    <button
                        type="button"
                        class="gb-pat gb-eraser pill"
                        class:active={erasing}
                        on:click={() => (erasing = true)}
                        title="erase"
                        aria-label="eraser">⌫</button
                    >
                </div>
                <div class="gb-sizes">
                    {#each SIZES as s}
                        <button
                            type="button"
                            class="gb-size pill"
                            class:active={size === s}
                            on:click={() => (size = s)}
                            aria-label={"brush size " + s}
                        >
                            <span
                                class="gb-dot"
                                style={`width:${s * 2 + 2}px;height:${s * 2 + 2}px;`}
                            ></span>
                        </button>
                    {/each}
                </div>
            {/if}

            <div class="gb-actions">
                <button
                    type="button"
                    class="gb-tool pill"
                    on:click={undo}
                    disabled={history.length === 0}>undo</button
                >
                <button type="button" class="gb-tool pill" on:click={clearAll}
                    >clear</button
                >
            </div>
        </div>

        <div
            class="gb-canvas-wrap"
            class:mode-draw={mode === "draw"}
            class:mode-type={mode === "type"}
            class:typing
            bind:this={wrapEl}
            tabindex="0"
            role="application"
            aria-label="drawing canvas — draw with a brush or switch to type"
            on:pointerdown={onLayerDown}
            on:keydown={onKeyDown}
            on:focusin={() => (typing = true)}
            on:focusout={() => (typing = false)}
        >
            <canvas
                class="gb-canvas-px"
                bind:this={canvasEl}
                width={W}
                height={H}
                on:pointerdown={onCanvasDown}
                on:pointermove={onCanvasMove}
            ></canvas>
            <div class="gb-tlayer" style={`--tc:${TC};--tr:${TR};`}>
                {#each text as row, r}
                    {#each row as ch, c}
                        <span
                            class="gb-tcell"
                            class:cursor={mode === "type" &&
                                r === curR &&
                                c === curC}>{ch}</span
                        >
                    {/each}
                {/each}
            </div>
            <input
                class="gb-keycatcher"
                bind:this={keyEl}
                type="text"
                inputmode="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                aria-label="type on the canvas"
                on:input={onKeyInput}
            />
        </div>
    </div>

    <div class="gb-fields">
        <div class="gb-name-row">
            <input
                class="gb-input gb-name"
                type="text"
                bind:value={name}
                placeholder="name"
                maxlength="50"
                required
            />
            <label
                class="gb-color-label"
                title="your favorite color — it tapes your entry to the wall"
            >
                <input
                    class="gb-color"
                    type="color"
                    bind:value={favoriteColor}
                />
                <span class="gb-color-text">color</span>
            </label>
        </div>
        <textarea
            class="gb-textarea"
            bind:value={message}
            placeholder="leave a message (optional)"
            maxlength="500"
            rows="2"
        ></textarea>
    </div>

    <div class="gb-submit-row">
        <button class="gb-submit pill" disabled={submitting}
            >{submitting ? "signing…" : "send ✦"}</button
        >
        {#if status === "success"}
            <span class="gb-status success">thanks for signing! ✧</span>
        {:else if status === "error"}
            <span class="gb-status error">{errorMsg}</span>
        {/if}
    </div>
</form>
