import { Command } from '@heroku-cli/command';
import * as Heroku from '@heroku-cli/schema';
export default class DomainsAdd extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        help: import("@oclif/core/lib/interfaces").BooleanFlag<void>;
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        cert: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        wait: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static args: {
        name: string;
        required: boolean;
    }[];
    certSelect: (certs: Array<Heroku.SniEndpoint>) => Promise<string>;
    run(): Promise<void>;
}
