import { Command } from '@heroku-cli/command';
import KolkrabbiAPI from '../../kolkrabbi-api';
interface AppInfo {
    name: string;
    repo?: string;
    hash?: string;
}
export default class PipelinesDiff extends Command {
    static description: string;
    static examples: string[];
    static flags: {
        app: import("@oclif/core/lib/interfaces").OptionFlag<string>;
        remote: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined>;
    };
    kolkrabbi: KolkrabbiAPI;
    getAppInfo: (appName: string, appId: string) => Promise<AppInfo>;
    run(): Promise<undefined>;
}
export {};
