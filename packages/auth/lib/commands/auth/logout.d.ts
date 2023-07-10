import { Command } from '@heroku-cli/command';
export default class Logout extends Command {
    static description: string;
    static aliases: string[];
    run(): Promise<void>;
}
