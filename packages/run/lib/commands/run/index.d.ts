import { Command } from '@heroku-cli/command';
export default class Run extends Command {
    static description: string;
    static examples: string[];
    static strict: boolean;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        size: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'exit-code': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'no-tty': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        listen: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        'no-notify': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
