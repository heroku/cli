import { Command } from '@heroku-cli/command';
export default class RunInside extends Command {
    static description: string;
    static hidden: boolean;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        'exit-code': import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        listen: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static strict: boolean;
    run(): Promise<void>;
}
