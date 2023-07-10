import { Command } from '@heroku-cli/command';
export declare class GitCredentials extends Command {
    static hidden: boolean;
    static description: string;
    static args: {
        name: string;
        required: boolean;
    }[];
    run(): Promise<void>;
}
