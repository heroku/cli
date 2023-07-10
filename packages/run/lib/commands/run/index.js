"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const debug_1 = require("debug");
const dyno_1 = require("../../lib/dyno");
const helpers_1 = require("../../lib/helpers");
const debug = (0, debug_1.default)('heroku:run');
class Run extends command_1.Command {
    async run() {
        const { argv, flags } = await this.parse(Run);
        const opts = {
            'exit-code': flags['exit-code'],
            'no-tty': flags['no-tty'],
            app: flags.app,
            attach: true,
            command: (0, helpers_1.buildCommand)(argv),
            env: flags.env,
            heroku: this.heroku,
            listen: flags.listen,
            notify: !flags['no-notify'],
            size: flags.size,
            type: flags.type,
        };
        if (!opts.command) {
            throw new Error('Usage: heroku run COMMAND\n\nExample: heroku run bash');
        }
        await this.heroku.get('/account');
        const dyno = new dyno_1.default(opts);
        try {
            await dyno.start();
            debug('done running');
        }
        catch (error) {
            debug(error);
            if (error.exitCode) {
                core_1.CliUx.ux.error(error.message, { code: error.exitCode, exit: error.exitCode });
            }
            else {
                throw error;
            }
        }
    }
}
exports.default = Run;
Run.description = 'run a one-off process inside a heroku dyno\nShows a notification if the dyno takes more than 20 seconds to start.';
Run.examples = [
    '$ heroku run bash',
    '$ heroku run -s standard-2x -- myscript.sh -a arg1 -s arg2',
];
// This is to allow for variable length arguments
Run.strict = false;
Run.flags = {
    app: command_1.flags.app({ description: 'parent app used by review apps', required: true }),
    remote: command_1.flags.remote(),
    size: command_1.flags.string({ char: 's', description: 'dyno size', completion: completions_1.DynoSizeCompletion }),
    type: command_1.flags.string({ description: 'process type', completion: completions_1.ProcessTypeCompletion }),
    'exit-code': command_1.flags.boolean({ char: 'x', description: 'passthrough the exit code of the remote command' }),
    env: command_1.flags.string({ char: 'e', description: "environment variables to set (use ';' to split multiple vars)" }),
    'no-tty': command_1.flags.boolean({ description: 'force the command to not run in a tty' }),
    listen: command_1.flags.boolean({ description: 'listen on a local port', hidden: true }),
    'no-notify': command_1.flags.boolean({ description: 'disables notification when dyno is up (alternatively use HEROKU_NOTIFICATIONS=0)' }),
};
