import { Command } from '@heroku-cli/command';
interface Config {
    [key: string]: string;
}
export declare function stringToConfig(s: string): Config;
export default class ConfigEdit extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    static args: {
        name: string;
        optional: boolean;
        description: string;
    }[];
    app: string;
    run(): Promise<void>;
    private fetchLatestConfig;
    private diffPrompt;
    private verifyUnchanged;
    private updateConfig;
}
export {};
