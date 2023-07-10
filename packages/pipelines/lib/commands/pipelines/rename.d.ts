import { Command } from '@heroku-cli/command';
export default class PipelinesRename extends Command {
    static description: string;
    static examples: string[];
    static args: {
        name: string;
        description: string;
        required: boolean;
    }[];
    run(): Promise<void>;
}
