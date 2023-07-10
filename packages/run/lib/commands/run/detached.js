"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:file-name-casing
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const dyno_1 = require("../../lib/dyno");
const helpers_1 = require("../../lib/helpers");
const log_displayer_1 = require("../../lib/log-displayer");
class RunDetached extends command_1.Command {
    async run() {
        const { flags, argv } = await this.parse(RunDetached);
        const opts = {
            heroku: this.heroku,
            app: flags.app,
            command: (0, helpers_1.buildCommand)(argv),
            size: flags.size,
            type: flags.type,
            env: flags.env,
            attach: false,
        };
        if (!opts.command) {
            throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
        }
        const dyno = new dyno_1.default(opts);
        await dyno.start();
        if (flags.tail) {
            await (0, log_displayer_1.default)(this.heroku, {
                app: flags.app,
                dyno: dyno.dyno.name,
                tail: true,
            });
        }
        else {
            core_1.CliUx.ux.log(`Run ${color_1.default.cmd('heroku logs --app ' + dyno.opts.app + ' --dyno ' + dyno.dyno.name)} to view the output.`);
        }
    }
}
exports.default = RunDetached;
RunDetached.description = 'run a detached dyno, where output is sent to your logs';
RunDetached.examples = [
    '$ heroku run:detached ls',
];
RunDetached.strict = false;
RunDetached.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    env: command_1.flags.string({ char: 'e', description: "environment variables to set (use ';' to split multiple vars)" }),
    size: command_1.flags.string({ char: 's', description: 'dyno size', completion: completions_1.DynoSizeCompletion }),
    tail: command_1.flags.boolean({ char: 't', description: 'continually stream logs' }),
    type: command_1.flags.string({ description: 'process type', completion: completions_1.ProcessTypeCompletion }),
};
