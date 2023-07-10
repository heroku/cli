import { Command } from '@heroku-cli/command';
import { Interfaces } from '@oclif/core';
export default class AuthToken extends Command {
    static description: string;
    static flags: Interfaces.FlagInput;
    run(): Promise<void>;
}
