export default class Git {
    exec(args: string[]): Promise<string>;
    spawn(args: string[]): Promise<unknown>;
    remoteFromGitConfig(): Promise<string | void>;
    httpGitUrl(app: string): string;
    remoteUrl(name: string): Promise<string>;
    url(app: string): string;
}
