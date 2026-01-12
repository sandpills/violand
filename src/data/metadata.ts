export const metadata = {
    location: "Brooklyn, NY",
    timezone: "America/New_York",
    status: "touching brains to touch hands",
    things: [
        "computer as earnest as stone",
        "teaching interface",
        "playing outside"
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
