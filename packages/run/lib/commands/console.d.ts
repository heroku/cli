import { Command } from '@heroku-cli/command';
export default class RunConsole extends Command {
    static hidden: boolean;
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        size: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        env: import("@oclif/core/lib/interfaces").OptionFlag<string>;
    };
    run(): Promise<void>;
}
