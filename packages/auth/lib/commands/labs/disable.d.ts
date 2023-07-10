import { Command } from '@heroku-cli/command';
import { Interfaces } from '@oclif/core';
export default class LabsDisable extends Command {
    static description: string;
    static args: {
        name: string;
    }[];
    static flags: Interfaces.FlagInput;
    run(): Promise<void>;
    disableFeature(feature: string, app?: string): Promise<any>;
}
