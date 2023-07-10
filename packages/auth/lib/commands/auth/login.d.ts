import { Command } from '@heroku-cli/command';
import { Interfaces } from '@oclif/core';
export default class Login extends Command {
    static description: string;
    static aliases: string[];
    static flags: Interfaces.FlagInput;
    run(): Promise<void>;
}
