<script>
    import { onMount } from "svelte";

    let currentTime = new Date();
    let clockContainer;

    const clockSize = 160;
    const centerX = clockSize / 2;
    const centerY = clockSize / 2;
    const pixelSize = 2;

    const hourHandLength = 38;
    const minuteHandLength = 45;
    const secondHandLength = 60;
    const handWidth = 3;

    $: {
        // Calculate angles (12 o'clock = 0 degrees)
        const hours = currentTime.getHours() % 12;
        const minutes = currentTime.getMinutes();
        const seconds = currentTime.getSeconds();
        const milliseconds = currentTime.getMilliseconds();

        hourAngle = (hours + minutes / 60) * 30 - 90; // 30° per hour
        minuteAngle = (minutes + seconds / 60) * 6 - 90; // 6° per minute
        secondAngle = (seconds + milliseconds / 1000) * 6 - 93; // 6° per second
    }

    // Make currentSecondValue reactive so template updates
    $: currentSecondValue = ((secondAngle + 93) / 6) % 60;

    // Create reactive array of highlighted dots
    $: highlightedDots = edgeDots.map((dot) => {
        const diff = Math.abs(currentSecondValue - 0.5 - dot.secondValue);
        const adjustedDiff = Math.min(diff, 60 - diff);
        return adjustedDiff < 0.5;
    });

    let hourAngle = 0;
    let minuteAngle = 0;
    let secondAngle = 0;
    let drift = { x: 0, y: 0 };
    let breathe = 1;

    onMount(() => {
        // update time 60 fps
        const timeInterval = setInterval(() => {
            currentTime = new Date();
        }, 16);

        // const driftInterval = setInterval(() => {
        //     drift.x = (Math.random() - 0.5) * 3;
        //     drift.y = (Math.random() - 0.5) * 3;
        // }, 4000);

        // // Breathing effect
        // const breatheInterval = setInterval(() => {
        //     breathe = 1 + Math.sin(Date.now() * 0.001) * 0.05;
        // }, 100);

        return () => {
            clearInterval(timeInterval);
            // clearInterval(driftInterval);
            // clearInterval(breatheInterval);
        };
    });

    function createGridDots() {
        const dots = [];
        for (let x = pixelSize; x < clockSize; x += pixelSize * 4) {
            for (let y = pixelSize; y < clockSize; y += pixelSize * 4) {
                const distance = Math.sqrt(
                    (x - centerX) ** 2 + (y - centerY) ** 2,
                );
                if (distance < clockSize / 2 - 5) {
                    dots.push({ x, y });
                }
            }
        }
        return dots;
    }

    // create edge dots around the circumference (60 dots, one every 6 degrees)
    function createEdgeDots() {
        const dots = [];
        const radius = clockSize / 2 - 8;
        // Create 60 dots (one for each second)
        for (let i = 0; i < 60; i++) {
            const angle = ((i * 6 - 90) * Math.PI) / 180; // 6° per second, starting at 12 o'clock
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            dots.push({ x, y, secondValue: i });
        }
        return dots;
    }

    const gridDots = createGridDots();
    const edgeDots = createEdgeDots();

    const hourMarkers = [
        { x: centerX, y: 8 }, // 12
        { x: clockSize - 8, y: centerY }, // 3
        { x: centerX, y: clockSize - 8 }, // 6
        { x: 8, y: centerY }, // 9
    ];

    // generate dots for hands
    function generateHandDots(length, spacing = 10) {
        const dots = [];
        for (let i = spacing; i <= length; i += spacing) {
            dots.push({ distance: i });
        }
        return dots;
    }

    function getHandDotPosition(distance, angle) {
        const radians = (angle * Math.PI) / 180;
        return {
            x: centerX + Math.cos(radians) * distance,
            y: centerY + Math.sin(radians) * distance,
        };
    }

    const hourDots = generateHandDots(hourHandLength, 4);
    const minuteDots = generateHandDots(minuteHandLength, 4);
    const secondDots = generateHandDots(secondHandLength, 4);
</script>

<div
    class="pixel-clock font-mono text-xs w-160px h-160px"
    bind:this={clockContainer}
    style="transform: translate({drift.x}px, {drift.y}px) scale({breathe})"
>
    <svg width={clockSize} height={clockSize} class="clock-face">
        <!-- gridline -->
        <!-- {#each gridDots as dot}
            <rect
                x={dot.x}
                y={dot.y}
                width={2}
                height={2}
                fill="gray"
                opacity="0.5"
            />
        {/each} -->

        {#each edgeDots as dot, i}
            <!-- Glow layer -->
            <rect
                class="edge-dot-glow"
                x={dot.x - pixelSize / 2}
                y={dot.y - pixelSize / 2}
                width={pixelSize * 2}
                height={pixelSize * 2}
                rx={pixelSize * 2}
                ry={pixelSize * 2}
                fill="rgba(0,0,255, 0.9)"
                opacity={highlightedDots[i] ? "1" : "0"}
            />
            <!-- Main dot -->
            <rect
                class="edge-dot"
                x={dot.x - pixelSize / 2}
                y={dot.y - pixelSize / 2}
                width={pixelSize * 2}
                height={pixelSize * 2}
                rx={pixelSize / 2}
                ry={pixelSize / 2}
                fill={highlightedDots[i] ? "#4080ff" : "#888888"}
                opacity={highlightedDots[i] ? "0" : "0.5"}
            />
            <!-- Inner bright core -->
            <!-- <rect
                class="edge-dot-core"
                x={dot.x - pixelSize / 4}
                y={dot.y - pixelSize / 4}
                width={pixelSize / 2}
                height={pixelSize / 2}
                rx={pixelSize / 4}
                ry={pixelSize / 4}
                fill="rgba(255, 255, 255, 0.8)"
                opacity={highlightedDots[i] ? "1" : "0"}
            /> -->
        {/each}

        <!-- Hour markers -->
        <!-- {#each hourMarkers as marker}
            <rect
                x={marker.x - pixelSize}
                y={marker.y - pixelSize}
                width={pixelSize * 2}
                height={pixelSize * 2}
                fill="#414141"
            />
        {/each} -->

        <!-- Hour hand dots -->
        {#each hourDots as dot}
            {@const pos = getHandDotPosition(dot.distance, hourAngle)}
            <rect
                x={pos.x - pixelSize}
                y={pos.y - pixelSize}
                width={pixelSize * 1}
                height={pixelSize * 1}
                fill="#2e2e2e"
            />
        {/each}

        <!-- Minute hand dots -->
        {#each minuteDots as dot}
            {@const pos = getHandDotPosition(dot.distance, minuteAngle)}
            <rect
                x={pos.x - 1}
                y={pos.y - 1}
                width="2"
                height="2"
                fill="#2e2e2e"
            />
        {/each}

        <!-- Second hand dots -->
        {#each secondDots as dot}
            {@const pos = getHandDotPosition(dot.distance, secondAngle)}
            <rect
                x={pos.x - 1}
                y={pos.y - 1}
                width="2"
                height="2"
                fill="#2e00fd"
                opacity="0.9"
            />
        {/each}

        <!-- Center dot -->
        <rect
            x={centerX - pixelSize}
            y={centerY - pixelSize}
            width={pixelSize * 2}
            height={pixelSize * 2}
            fill="black"
        />
    </svg>
    <p
        class="glow w-full text-xl font-serif italic text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    >
        {currentTime.toLocaleTimeString()}
    </p>
</div>

<style>
    .pixel-clock {
        /* transition: transform 0.3s ease-out; */
        display: inline-block;
    }

    .clock-face {
        /* filter: contrast(1.1); */
    }

    svg rect {
        transition:
            x 0.1s ease-out,
            y 0.1s ease-out;
    }

    /* Smooth transitions for edge dots */
    .edge-dot {
        transition:
            opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            fill 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    .edge-dot-glow {
        transition: opacity 1s;
    }

    /* Pulsing animation for highlighted dots */
    @keyframes pulse-glow {
        0%,
        100% {
            opacity: 0.3;
            transform: scale(0);
            transform: translate(0, 0);
        }
        50% {
            opacity: 0.9;
            transform: scale(0.9);
            transform: translate(0, 0);
        }
    }

    .edge-dot-glow[opacity="1"] {
        animation: pulse-glow 1s ease-in-out infinite;
    }

    .pixel-clock:hover {
        transition: all 0.2s ease-out;
        border-radius: 100px;
        /* border: 1px solid rgb(151, 151, 151); */
        box-shadow: inset 0 0 30px 0 rgba(76, 85, 130, 0.2);
        box-shadow: 0 0 30px 0 rgba(244, 244, 255, 0.2);
    }

    .glow {
        color: #c7c7c7;
        border-radius: 100px;
        text-align: center;
        -webkit-animation: glow 1s ease-in-out infinite alternate;
        -moz-animation: glow 1s ease-in-out infinite alternate;
        animation: glow 1s ease-in-out infinite alternate;
    }

    @-webkit-keyframes glow {
        from {
            text-shadow:
                0 0 2px #c7c7c7,
                0 0 3px #c7c7c7,
                0 0 4px #949bfb,
                0 0 5px #949bfb,
                0 0 6px #949bfb,
                0 0 7px #6c76ff,
                0 0 8px #949bfb;
        }
        to {
            text-shadow:
                0 0 3px #c7c7c7,
                0 0 4px #c7c7c7,
                0 0 5px #c7c7c7,
                0 0 6px #c7c7c7,
                0 0 7px #c7c7c7,
                0 0 8px #c7c7c7,
                0 0 9px #c7c7c7;
        }
    }
</style>
