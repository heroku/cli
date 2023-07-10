import { Command } from '@heroku-cli/command';
export default class DomainsUpdate extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        help: import("@oclif/core/lib/interfaces").BooleanFlag<void>;
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        cert: import("@oclif/core/lib/interfaces").OptionFlag<string>;
    };
    static args: {
        name: string;
    }[];
    run(): Promise<void>;
}
