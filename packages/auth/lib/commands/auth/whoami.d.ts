import { Command } from '@heroku-cli/command';
export default class AuthWhoami extends Command {
    static description: string;
    static aliases: string[];
    run(): Promise<void>;
    notloggedin(): void;
}
