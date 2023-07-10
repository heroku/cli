import { Command } from '@heroku-cli/command';
export default class Versions extends Command {
    static description: string;
    static args: {
        name: string;
        required: boolean;
        description: string;
    }[];
    run(): Promise<void>;
}
