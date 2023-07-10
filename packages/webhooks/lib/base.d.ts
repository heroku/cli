import { APIClient, Command } from '@heroku-cli/command';
import { Config } from '@oclif/core';
export default abstract class extends Command {
    webhooksClient: APIClient;
    protected constructor(argv: string[], config: Config);
    webhookType(context: {
        pipeline?: string;
        app?: string;
    }): {
        path: string;
        display: string;
    };
}
