import { Command } from '@heroku-cli/command';
export declare class ConfigIndex extends Command {
    static description: string;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        shell: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
