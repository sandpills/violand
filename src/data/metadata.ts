export const metadata = {
    location: "San Francisco",
    timezone: "America/Los_Angeles",
    status: "touching brains to touch hands",
    things: [
        "art and tech is fake",
        "unemployment",
        "need to do my O1 visa!!"
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
