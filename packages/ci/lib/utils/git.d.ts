declare function createArchive(ref: string): Promise<any>;
declare function githubRepository(): Promise<any>;
declare function readCommit(commit: string): Promise<{
    branch: string | undefined;
    ref: string | undefined;
    message: string | undefined;
}>;
export { createArchive, githubRepository, readCommit, };
