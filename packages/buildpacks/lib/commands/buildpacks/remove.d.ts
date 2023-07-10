import { Command } from '@heroku-cli/command';
export default class Remove extends Command {
    static description: string;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        index: import("@oclif/core/lib/interfaces").OptionFlag<number | undefined>;
    };
    static args: {
        name: string;
        description: string;
    }[];
    run(): Promise<void>;
}
