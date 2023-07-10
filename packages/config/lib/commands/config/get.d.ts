import { Command } from '@heroku-cli/command';
export declare class ConfigGet extends Command {
    static usage: string;
    static description: string;
    static example: string;
    static strict: boolean;
    static args: {
        name: string;
        required: boolean;
    }[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        shell: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
