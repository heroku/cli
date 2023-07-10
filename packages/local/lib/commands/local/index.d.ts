import { Command } from '@oclif/core';
export default class Index extends Command {
    static description: string;
    static aliases: string[];
    static args: {
        name: string;
        required: boolean;
    }[];
    static examples: string[];
    static flags: {
        procfile: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        port: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        restart: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        concurrency: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    run(): Promise<void>;
}
