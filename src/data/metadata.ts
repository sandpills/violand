export const metadata = {
    location: "Shanghai",
    timezone: "Asia/Shanghai",
    status: "working on something new",
    things: [
        "computer art",
        "malware",
        "almost done with O1 visa!!!"
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
