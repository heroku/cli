import { Command } from '@heroku-cli/command';
export default class Setup extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        team: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        yes: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    run(): Promise<void>;
}
