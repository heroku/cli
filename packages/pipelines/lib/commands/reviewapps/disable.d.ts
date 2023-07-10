import { Command } from '@heroku-cli/command';
export default class ReviewappsDisable extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        pipeline: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        autodeploy: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        autodestroy: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'wait-for-ci': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'no-autodeploy': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'no-autodestroy': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'no-wait-for-ci': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
