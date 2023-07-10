import { Command } from '@heroku-cli/command';
export default class Wait extends Command {
    static description: string;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        'wait-interval': import("@oclif/core/lib/interfaces").OptionFlag<number>;
        'with-run': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
