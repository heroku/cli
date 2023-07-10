import { Command } from '@heroku-cli/command';
export default class RunRake extends Command {
    static hidden: boolean;
    static strict: boolean;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        size: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'exit-code': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'no-tty': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
