"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const METRICS_HOST = 'api.metrics.heroku.com';
const isPerfOrPrivateTier = (size) => {
    const applicableTiers = ['performance', 'private', 'shield'];
    return applicableTiers.some(tier => size.toLowerCase().includes(tier));
};
class Enable extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Enable);
        core_1.CliUx.ux.action.start('Enabling dyno autoscaling');
        const [appResponse, formationResponse] = await Promise.all([
            this.heroku.get(`/apps/${flags.app}`),
            this.heroku.get(`/apps/${flags.app}/formation`),
        ]);
        const app = appResponse.body;
        const formations = formationResponse.body;
        const webFormation = formations.find((f) => f.type === 'web');
        if (!webFormation)
            throw new Error(`${flags.app} does not have any web dynos to scale`);
        const { size } = webFormation;
        if (!isPerfOrPrivateTier(size || '')) {
            throw new Error('Autoscaling is only available with Performance or Private dynos');
        }
        const { body } = await this.heroku.get(`/apps/${app.id}/formation/web/monitors`, {
            hostname: METRICS_HOST,
        });
        const scaleMonitor = (body || []).find((m) => m.action_type === 'scale');
        let updatedValues = {
            is_active: true,
            action_type: 'scale',
            notification_period: 1440,
            op: 'GREATER_OR_EQUAL',
            period: 1,
            notification_channels: flags.notifications ? ['app'] : [],
        };
        if (scaleMonitor) {
            updatedValues = Object.assign(Object.assign({}, updatedValues), { min_quantity: flags.min || scaleMonitor.min_quantity, max_quantity: flags.max || scaleMonitor.max_quantity, value: flags.p95 ? flags.p95 : scaleMonitor.value });
            await this.heroku.patch(`/apps/${app.id}/formation/web/monitors/${scaleMonitor.id}`, {
                body: updatedValues,
                hostname: METRICS_HOST,
            });
        }
        else {
            updatedValues = Object.assign(Object.assign({}, updatedValues), { name: 'LATENCY_SCALE', min_quantity: flags.min, max_quantity: flags.max, value: flags.p95 ? flags.p95 : 1000 });
            await this.heroku.post(`/apps/${app.id}/formation/web/monitors`, {
                hostname: METRICS_HOST,
                body: updatedValues,
            });
        }
        core_1.CliUx.ux.action.stop();
    }
}
exports.default = Enable;
Enable.description = 'enable web dyno autoscaling';
Enable.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    min: command_1.flags.integer({ required: true, description: 'minimum number of dynos' }),
    max: command_1.flags.integer({ required: true, description: 'maximum number of dynos' }),
    p95: command_1.flags.integer({ description: 'desired p95 response time' }),
    notifications: command_1.flags.boolean({ description: 'receive email notifications when the max dyno limit is reached' }),
};
