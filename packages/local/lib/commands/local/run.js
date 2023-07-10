"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const fork_foreman_1 = require("../../fork-foreman");
class Run extends core_1.Command {
    async run() {
        const execArgv = ['run'];
        const { argv, flags } = await this.parse(Run);
        if (argv.length === 0) {
            const errorMessage = 'Usage: heroku local:run [COMMAND]\nMust specify command to run';
            this.error(errorMessage, { exit: -1 });
        }
        if (flags.env)
            execArgv.push('--env', flags.env);
        if (flags.port)
            execArgv.push('--port', flags.port);
        execArgv.push('--'); // disable node-foreman flag parsing
        execArgv.push(...argv); // eslint-disable-line unicorn/no-array-push-push
        await (0, fork_foreman_1.fork)(execArgv);
    }
}
exports.default = Run;
Run.description = 'run a one-off command';
Run.examples = [
    '$ heroku local:run bin/migrate',
];
Run.strict = false;
Run.flags = {
    env: core_1.Flags.string({
        char: 'e',
        completion: completions_1.FileCompletion,
    }),
    port: core_1.Flags.string({
        char: 'p',
        default: '5001',
    }),
};
