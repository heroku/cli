import { Command } from '@oclif/core';
export default class CertsAutoWait extends Command {
    static description: string;
    static hidden: boolean;
    static flags: {
        help: import("@oclif/core/lib/interfaces").BooleanFlag<void>;
    };
    run(): Promise<void>;
}
