import { Command } from '@oclif/core';
export default class Version extends Command {
    static description: string;
    run(): Promise<void>;
}
