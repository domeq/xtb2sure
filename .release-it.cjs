module.exports = {
    git: {
        // biome-ignore lint/suspicious/noTemplateCurlyInString: release-it placeholders
        commitMessage: "chore: release ${version} \n\n${changelog}",
        requireBranch: "main",
        requireCleanWorkingDir: true,
        // biome-ignore lint/suspicious/noTemplateCurlyInString: release-it placeholders
        tagName: "v${version}",
    },
    github: {
        release: true,
        tokenRef: "GITHUB_TOKEN",
    },
    npm: {
        publish: true,
        skipChecks: true,
    },
    plugins: {
        "@release-it/conventional-changelog": {
            infile: "CHANGELOG.md",
            preset: {
                name: "conventionalcommits",
                types: [
                    { section: "Features", type: "feat" },
                    { section: "Features", type: "feature" },
                    { section: "Bug Fixes", type: "fix" },
                    { section: "Performance Improvements", type: "perf" },
                    { section: "Reverts", type: "revert" },
                    { section: "Documentation", type: "docs" },
                    { section: "Styles", type: "style" },
                    { section: "Miscellaneous Chores", type: "chore" },
                    { section: "Code Refactoring", type: "refactor" },
                    { section: "Tests", type: "test" },
                    { section: "Build System", type: "build" },
                    { section: "Continuous Integration", type: "ci" },
                    { section: "Configuration changes", type: "config" },
                ],
            },
        },
    },
};
