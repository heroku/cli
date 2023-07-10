"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const base_1 = require("../../../base");
class Info extends base_1.default {
    async run() {
        const { flags, args } = await this.parse(Info);
        const { path } = this.webhookType(flags);
        core_1.CliUx.ux.warn('heroku webhooks:event:info is deprecated, please use heroku webhooks:deliveries:info');
        const { body: webhookEvent } = await this.webhooksClient.get(`${path}/webhook-events/${args.id}`);
        const obj = {
            payload: JSON.stringify(webhookEvent.payload, null, 2),
        };
        core_1.CliUx.ux.styledHeader(webhookEvent.id);
        core_1.CliUx.ux.styledObject(obj);
    }
}
exports.default = Info;
Info.description = 'info for a webhook event on an app';
Info.examples = [
    '$ heroku webhooks:events:info 99999999-9999-9999-9999-999999999999',
];
Info.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
};
Info.args = [
    { name: 'id', required: true },
];
