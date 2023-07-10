import { Command } from '@heroku-cli/command';
import * as Heroku from '@heroku-cli/schema';
export default class DomainsIndex extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        sort: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        columns: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        filter: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        csv: import("@oclif/core/lib/interfaces").Flag<boolean>;
        output: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        extended: import("@oclif/core/lib/interfaces").Flag<boolean>;
        'no-header': import("@oclif/core/lib/interfaces").Flag<boolean>;
        help: import("@oclif/core/lib/interfaces").BooleanFlag<void>;
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        json: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    tableConfig: (needsEndpoints: boolean) => {
        hostname: {
            header: string;
        };
        kind: {
            header: string;
            get: (domain: Heroku.Domain) => "ALIAS or ANAME" | "CNAME" | undefined;
        };
        cname: {
            header: string;
        };
        acm_status: {
            header: string;
            extended: boolean;
        };
        acm_status_reason: {
            header: string;
            extended: boolean;
        };
    };
    run(): Promise<void>;
}
