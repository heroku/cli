"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const fork_foreman_1 = require("../../fork-foreman");
// eslint-disable-next-line node/no-missing-require
const Procfile = require('../../load-foreman-procfile');
class Index extends core_1.Command {
    async run() {
        const execArgv = ['start'];
        const { args, flags } = await this.parse(Index);
        if (flags.restart) {
            this.error('--restart is no longer available\nUse forego instead: https://github.com/ddollar/forego');
        }
        if (flags.concurrency) {
            this.error('--concurrency is no longer available\nUse forego instead: https://github.com/ddollar/forego');
        }
        if (flags.procfile)
            execArgv.push('--procfile', flags.procfile);
        if (flags.env)
            execArgv.push('--env', flags.env);
        if (flags.port)
            execArgv.push('--port', flags.port);
        if (args.processname) {
            execArgv.push(args.processname);
        }
        else {
            const procfile = flags.procfile || 'Procfile';
            const procHash = Procfile.loadProc(procfile);
            const processes = Object.keys(procHash).filter(x => x !== 'release');
            execArgv.push(processes.join(','));
        }
        await (0, fork_foreman_1.fork)(execArgv);
    }
}
exports.default = Index;
// \n splits the description between the title shown in the help
// and the DESCRIPTION section shown in the help
Index.description = 'run heroku app locally\nStart the application specified by a Procfile (defaults to ./Procfile)';
Index.aliases = ['local:start'];
Index.args = [{ name: 'processname', required: false }];
Index.examples = [
    `$ heroku local
$ heroku local web
$ heroku local web=2
$ heroku local web=1,worker=2`,
];
Index.flags = {
    procfile: core_1.Flags.string({
        char: 'f',
        description: 'use a different Procfile',
        completion: completions_1.FileCompletion,
    }),
    env: core_1.Flags.string({
        char: 'e',
        description: 'location of env file (defaults to .env)',
        completion: completions_1.FileCompletion,
    }),
    port: core_1.Flags.string({
        char: 'p',
        description: 'port to listen on',
    }),
    restart: core_1.Flags.boolean({
        char: 'r',
        description: 'restart process if it dies',
        hidden: true,
    }),
    concurrency: core_1.Flags.string({
        char: 'c',
        description: 'number of processes to start',
        hidden: true,
    }),
};
