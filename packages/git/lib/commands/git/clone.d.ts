import { Command } from '@heroku-cli/command';
export declare class GitClone extends Command {
    static description: string;
    static example: string;
    static args: {
        name: string;
        optional: boolean;
        description: string;
    }[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    run(): Promise<void>;
}
