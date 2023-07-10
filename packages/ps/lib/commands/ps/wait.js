"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
class Wait extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Wait);
        const { body: releases } = await this.heroku.request(`/apps/${flags.app}/releases`, {
            partial: true,
            headers: {
                Range: 'version ..; max=1, order=desc',
            },
        });
        if (releases.length === 0) {
            this.warn(`App ${flags.app} has no releases`);
            return;
        }
        const latestRelease = releases[0];
        let released = true;
        const interval = flags['wait-interval'];
        while (1) {
            const { body: dynos } = await this.heroku.get(`/apps/${flags.app}/dynos`);
            const relevantDynos = dynos
                .filter(dyno => dyno.type !== 'release')
                .filter(dyno => flags['with-run'] || dyno.type !== 'run')
                .filter(dyno => !flags.type || dyno.type === flags.type);
            const onLatest = relevantDynos.filter((dyno) => {
                return dyno.state === 'up' &&
                    latestRelease.version !== undefined &&
                    dyno.release !== undefined &&
                    dyno.release.version !== undefined &&
                    dyno.release.version >= latestRelease.version;
            });
            const releasedFraction = `${onLatest.length} / ${relevantDynos.length}`;
            if (onLatest.length === relevantDynos.length) {
                if (!released) {
                    core_1.CliUx.ux.action.stop(`${releasedFraction}, done`);
                }
                break;
            }
            if (released) {
                released = false;
                core_1.CliUx.ux.action.start(`Waiting for every dyno to be running v${latestRelease.version}`);
            }
            core_1.CliUx.ux.action.status = releasedFraction;
            await core_1.CliUx.ux.wait(interval * 1000);
        }
    }
}
exports.default = Wait;
_a = Wait;
Wait.description = 'wait for all dynos to be running latest version after a release';
Wait.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    type: command_1.flags.string({
        char: 't',
        description: 'wait for one specific dyno type',
    }),
    'wait-interval': command_1.flags.integer({
        char: 'w',
        description: 'how frequently to poll in seconds (to avoid hitting Heroku API rate limits)',
        parse: async (input) => {
            const w = Number.parseInt(input, 10);
            if (w < 10) {
                core_1.CliUx.ux.error('wait-interval must be at least 10', { exit: 1 });
            }
            return w;
        },
        default: 10,
    }),
    'with-run': command_1.flags.boolean({
        char: 'R',
        description: 'whether to wait for one-off run dynos',
        exclusive: ['type'],
    }),
};
