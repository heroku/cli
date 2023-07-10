import { Command } from '@heroku-cli/command';
export default class Enable extends Command {
    static description: string;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        min: import("@oclif/core/lib/interfaces").OptionFlag<number>;
        max: import("@oclif/core/lib/interfaces").OptionFlag<number>;
        p95: import("@oclif/core/lib/interfaces").OptionFlag<number | undefined>;
        notifications: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
