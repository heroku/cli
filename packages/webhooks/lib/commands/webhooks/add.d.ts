import BaseCommand from '../../base';
export default class WebhooksAdd extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        pipeline: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        include: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        level: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        secret: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        authorization: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        url: import("@oclif/core/lib/interfaces").OptionFlag<string>;
    };
    run(): Promise<void>;
}
