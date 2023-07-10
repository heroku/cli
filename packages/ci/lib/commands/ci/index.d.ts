import { Command } from '@heroku-cli/command';
export default class CiIndex extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        watch: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        pipeline: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
