import { Command } from '@heroku-cli/command';
export declare class GitRemote extends Command {
    static description: string;
    static example: string;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static strict: boolean;
    run(): Promise<void>;
}
