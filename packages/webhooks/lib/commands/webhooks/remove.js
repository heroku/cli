"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
const base_1 = require("../../base");
class WebhooksRemove extends base_1.default {
    async run() {
        const { flags, args } = await this.parse(WebhooksRemove);
        const { path, display } = this.webhookType(flags);
        const action = new spinner_1.default();
        action.start(`Removing webhook ${args.id} from ${display}`);
        await this.webhooksClient.delete(`${path}/webhooks/${args.id}`);
        action.stop();
    }
}
exports.default = WebhooksRemove;
WebhooksRemove.description = 'removes a webhook from an app';
WebhooksRemove.examples = [
    '$ heroku webhooks:remove 99999999-9999-9999-9999-999999999999',
];
WebhooksRemove.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
};
WebhooksRemove.args = [
    { name: 'id', description: 'id of webhook to remove', required: true },
];
