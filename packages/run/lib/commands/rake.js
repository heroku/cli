"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:file-name-casing
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const dyno_1 = require("../lib/dyno");
const helpers_1 = require("../lib/helpers");
class RunRake extends command_1.Command {
    async run() {
        const { flags, argv } = await this.parse(RunRake);
        const opts = {
            heroku: this.heroku,
            app: flags.app,
            command: (0, helpers_1.buildCommand)(['rake', ...argv]),
            size: flags.size,
            'exit-code': flags['exit-code'],
            env: flags.env,
            'no-tty': flags['no-tty'],
            attach: true,
        };
        const dyno = new dyno_1.default(opts);
        try {
            await dyno.start();
        }
        catch (error) {
            if (error.exitCode) {
                core_1.CliUx.ux.error(error, { exit: error.exitCode });
            }
            else {
                throw error;
            }
        }
    }
}
exports.default = RunRake;
RunRake.hidden = true;
RunRake.strict = false;
RunRake.flags = {
    app: command_1.flags.app({ description: 'parent app used by review apps', required: true }),
    remote: command_1.flags.remote(),
    size: command_1.flags.string({ char: 's', description: 'dyno size', completion: completions_1.DynoSizeCompletion }),
    'exit-code': command_1.flags.boolean({ char: 'x', description: 'passthrough the exit code of the remote command' }),
    env: command_1.flags.string({ char: 'e', description: "environment variables to set (use ';' to split multiple vars)" }),
    'no-tty': command_1.flags.boolean({ description: 'force the command to not run in a tty' }),
};
