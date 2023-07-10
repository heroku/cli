"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const METRICS_HOST = 'api.metrics.heroku.com';
class Disable extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Disable);
        core_1.CliUx.ux.action.start('Disabling dyno autoscaling');
        const appResponse = await this.heroku.get(`/apps/${flags.app}`);
        const app = appResponse.body;
        const monitorsResponse = await this.heroku.get(`/apps/${app.id}/formation/web/monitors`, {
            hostname: METRICS_HOST,
        });
        const monitors = monitorsResponse.body;
        const scaleMonitor = monitors.find((m) => m.action_type === 'scale');
        if (!scaleMonitor)
            throw new Error(`${flags.app} does not have autoscale enabled`);
        await this.heroku.patch(`/apps/${app.id}/formation/web/monitors/${scaleMonitor.id}`, {
            hostname: METRICS_HOST,
            body: {
                is_active: false,
                period: 1,
                op: 'GREATER_OR_EQUAL',
            },
        });
        core_1.CliUx.ux.action.stop();
    }
}
exports.default = Disable;
Disable.description = 'disable web dyno autoscaling';
Disable.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
