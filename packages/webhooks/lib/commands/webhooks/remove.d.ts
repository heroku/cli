import BaseCommand from '../../base';
export default class WebhooksRemove extends BaseCommand {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
        pipeline: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    run(): Promise<void>;
}
