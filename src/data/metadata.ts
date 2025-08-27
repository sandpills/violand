export const metadata = {
    location: "Shanghai, China",
    timezone: "Asia/Shanghai",
    status: "✍️ i'm trying my best ok?",
    things: [
        "computation as earnest as stone",
        "oddly shaped browser windows",
        "buffy the vampire slayer"
    ]
};

export const getGitLastCommit = async (): Promise<string> => {
    try {
        const { execSync } = await import("child_process");
        const gitOutput = execSync("git log -1 --format=%cd --date=iso")
            .toString()
            .trim();
        return gitOutput;
    } catch (error) {
        // Fallback to current date
        return new Date().toISOString();
    }
};
