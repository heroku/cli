import { Command } from '@heroku-cli/command';
export default class Regions extends Command {
    static topic: string;
    static description: string;
    static flags: {
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        private: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        common: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
}
