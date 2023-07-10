"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:file-name-casing
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const log_displayer_1 = require("../lib/log-displayer");
class Logs extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Logs);
        color_1.default.enabled = flags['force-colors'] || color_1.default.enabled;
        await (0, log_displayer_1.default)(this.heroku, {
            app: flags.app,
            dyno: flags.dyno || flags.ps,
            lines: flags.num || 100,
            tail: flags.tail,
            source: flags.source,
        });
    }
}
exports.default = Logs;
Logs.description = `display recent log output
disable colors with --no-color, HEROKU_LOGS_COLOR=0, or HEROKU_COLOR=0`;
Logs.examples = [
    '$ heroku logs --app=my-app',
    '$ heroku logs --num=50',
    '$ heroku logs --dyno=web --app=my-app',
    '$ heroku logs --app=my-app --tail',
];
Logs.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    num: command_1.flags.integer({ char: 'n', description: 'number of lines to display' }),
    ps: command_1.flags.string({ char: 'p', description: 'hidden alias for dyno', hidden: true }),
    dyno: command_1.flags.string({
        char: 'd',
        description: 'only show output from this dyno type (such as "web" or "worker")',
        completion: completions_1.ProcessTypeCompletion,
    }),
    source: command_1.flags.string({ char: 's', description: 'only show output from this source (such as "app" or "heroku")' }),
    tail: command_1.flags.boolean({ char: 't', description: 'continually stream logs' }),
    'force-colors': command_1.flags.boolean({ description: 'force use of colors (even on non-tty output)' }),
};
