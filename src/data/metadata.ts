export const metadata = {
    location: "Kyoto, Japan",
    timezone: "Asia/Tokyo",
    status: "🌴 not bored at the temples",
    things: [
        "teaching",
        "oddly shaped browser windows",
        "espresso tonic"
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
