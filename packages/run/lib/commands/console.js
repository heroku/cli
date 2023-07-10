"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:file-name-casing
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const dyno_1 = require("../lib/dyno");
const helpers_1 = require("../lib/helpers");
class RunConsole extends command_1.Command {
    async run() {
        const { flags } = await this.parse(RunConsole);
        const opts = {
            heroku: this.heroku,
            app: flags.app,
            command: (0, helpers_1.buildCommand)(['console']),
            size: flags.size,
            env: flags.env,
            attach: true,
        };
        const dyno = new dyno_1.default(opts);
        await dyno.start();
    }
}
exports.default = RunConsole;
RunConsole.hidden = true;
RunConsole.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    size: command_1.flags.string({ char: 's', description: 'dyno size', completion: completions_1.DynoSizeCompletion }),
    env: command_1.flags.string({ char: 'e', description: 'environment variables to set (use \';\' to split multiple vars)' }),
};
