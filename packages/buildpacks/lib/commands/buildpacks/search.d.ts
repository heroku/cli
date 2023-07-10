import { Command } from '@heroku-cli/command';
export default class Search extends Command {
    static description: string;
    static flags: {
        namespace: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        name: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        description: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static args: {
        name: string;
        description: string;
    }[];
    run(): Promise<void>;
}
