import { Command } from '@heroku-cli/command';
export default class Logs extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        num: import("@oclif/core/lib/interfaces").OptionFlag<number>;
        ps: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        dyno: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        source: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        tail: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'force-colors': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
