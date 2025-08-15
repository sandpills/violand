<script>
    import { onMount } from "svelte";

    let currentTime = new Date();
    let currentTimeString = currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
    let clockContainer;

    const clockSize = 600;
    const centerX = clockSize / 2;
    const centerY = clockSize / 2;
    const pixelSize = 6;

    const hourHandLength = clockSize / 6;
    const minuteHandLength = clockSize / 3;
    const secondHandLength = clockSize / 2.5;
    const handWidth = 10;

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
        }, 32);

        // Breathing effect
        const breatheInterval = setInterval(() => {
            breathe = 1 + Math.sin(Date.now() * 0.001) * 0.02;
        }, 60);

        return () => {
            clearInterval(timeInterval);
            // clearInterval(driftInterval);
            clearInterval(breatheInterval);
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

    const hourDots = generateHandDots(hourHandLength, 8);
    const minuteDots = generateHandDots(minuteHandLength, 8);
    const secondDots = generateHandDots(secondHandLength, 8);
</script>

<div
    class="pixel-clock"
    bind:this={clockContainer}
    style="transform: translate({drift.x}px, {drift.y}px) scale({breathe})"
>
    <p
        class="glow w-full text-6xl text-center absolute bottom-1/4 left-1/2 -translate-x-1/2 font-workbench"
    >
        {currentTimeString}
    </p>
    <svg width={clockSize} height={clockSize} class="clock-face z-10">
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
                fill={highlightedDots[i] ? "blue" : "#8e8e8e"}
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
                fill={highlightedDots[i] ? "blue" : "#5e5e5e"}
                opacity={highlightedDots[i] ? "0" : "0.9"}
            />
        {/each}

        <!-- Hour hand dots -->
        {#each hourDots as dot}
            {@const pos = getHandDotPosition(dot.distance, hourAngle)}
            <rect
                x={pos.x - 1}
                y={pos.y - 1}
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
                width={pixelSize * 1}
                height={pixelSize * 1}
                fill="#2e2e2e"
            />
        {/each}

        <!-- Second hand dots -->
        {#each secondDots as dot}
            {@const pos = getHandDotPosition(dot.distance, secondAngle)}
            <rect
                x={pos.x - 1}
                y={pos.y - 1}
                width={pixelSize * 1}
                height={pixelSize * 1}
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
            fill="gray"
        />
    </svg>
</div>

<style>
    .pixel-clock {
        /* transition: transform 0.3s ease-out; */
        display: inline-block;
        /* Enable hardware acceleration for smooth animations */
        transform: translateZ(10);
        will-change: transform;
    }

    .clock-face {
        /* filter: contrast(1.1); */
    }

    svg rect {
        transition:
            x 0.1s ease-out,
            y 0.1s ease-out;
        /* Enable hardware acceleration for smooth hand movement */
        transform: translateZ(0);
    }

    /* Smooth transitions for edge dots */
    .edge-dot {
        transition:
            opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            fill 1s ease-in-out;
    }

    .edge-dot-glow {
        transition:
            opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94),
            fill 1s ease-in-out;
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

    /* .edge-dot-glow[opacity="1"] {
        animation: pulse-glow 1s ease-in-out infinite;
    } */

    .pixel-clock:hover {
        transition: all 0.2s ease-out;
        border-radius: 500px;
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

    @keyframes glow {
        from {
            text-shadow:
                0 0 2px #c7c7c7,
                0 0 3px #c7c7c7,
                0 0 4px #949bfb,
                0 0 5px #949bfb,
                0 0 6px #949bfb,
                0 0 7px #6c76ff,
                0 0 8px #949bfb;
            color: #0004ff;
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
