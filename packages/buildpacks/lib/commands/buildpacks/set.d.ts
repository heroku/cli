import { Command } from '@heroku-cli/command';
export default class Set extends Command {
    static description: 'set new app buildpack, overwriting into list of buildpacks if necessary';
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        index: import("@oclif/core/lib/interfaces").OptionFlag<number | undefined>;
    };
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    run(): Promise<void>;
}
