import { Command } from '@heroku-cli/command';
export default class Auth2faGenerate extends Command {
    static description: string;
    static example: string;
    static aliases: string[];
    run(): Promise<void>;
}
