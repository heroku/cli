"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:file-name-casing
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const debug_1 = require("debug");
const dyno_1 = require("../../lib/dyno");
const helpers_1 = require("../../lib/helpers");
const debug = (0, debug_1.default)('heroku:run:inside');
class RunInside extends command_1.Command {
    async run() {
        const { flags, argv } = await this.parse(RunInside);
        if (argv.length < 2) {
            throw new Error('Usage: heroku run:inside DYNO COMMAND\n\nExample: heroku run:inside web.1 bash');
        }
        const opts = {
            'exit-code': flags['exit-code'],
            app: flags.app,
            command: (0, helpers_1.buildCommand)(argv.slice(1)),
            dyno: argv[0],
            env: flags.env,
            heroku: this.heroku,
            listen: flags.listen,
        };
        const dyno = new dyno_1.default(opts);
        try {
            await dyno.start();
        }
        catch (error) {
            debug(error);
            if (error.exitCode) {
                core_1.CliUx.ux.exit(error.exitCode);
            }
            else {
                throw error;
            }
        }
    }
}
exports.default = RunInside;
RunInside.description = 'run a one-off process inside an existing heroku dyno';
RunInside.hidden = true;
RunInside.examples = [
    '$ heroku run:inside web.1 bash',
];
RunInside.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    'exit-code': command_1.flags.boolean({ char: 'x', description: 'passthrough the exit code of the remote command' }),
    env: command_1.flags.string({ char: 'e', description: "environment variables to set (use ';' to split multiple vars)" }),
    listen: command_1.flags.boolean({ description: 'listen on a local port', hidden: true }),
};
RunInside.strict = false;
