import { Command } from '@heroku-cli/command';
export default class RunDetached extends Command {
    static description: string;
    static examples: string[];
    static strict: boolean;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        size: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        tail: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        type: import("@oclif/core/lib/interfaces").OptionFlag<string>;
    };
    run(): Promise<void>;
}
