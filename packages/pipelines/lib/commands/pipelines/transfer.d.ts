import { Command } from '@heroku-cli/command';
export default class PipelinesTransfer extends Command {
    static description: string;
    static examples: string[];
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    static flags: {
        pipeline: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        confirm: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    run(): Promise<void>;
}
