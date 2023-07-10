"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
const base_1 = require("../../base");
class WebhooksUpdate extends base_1.default {
    async run() {
        const { flags, args } = await this.parse(WebhooksUpdate);
        const { path, display } = this.webhookType(flags);
        const action = new spinner_1.default();
        action.start(`Updating webhook ${args.id} for ${display}`);
        await this.webhooksClient.patch(`${path}/webhooks/${args.id}`, {
            body: {
                include: flags.include && flags.include.split(',').map(s => s.trim()),
                level: flags.level,
                secret: flags.secret,
                url: flags.url,
            },
        });
        action.stop();
    }
}
exports.default = WebhooksUpdate;
WebhooksUpdate.description = 'updates a webhook in an app';
WebhooksUpdate.examples = [
    '$ heroku webhooks:update 99999999-9999-9999-9999-999999999999 -i dyno -l notify -s 09928c40bf1b191b645174a19f7053d16a180da37332e719ef0998f4c0a2 -u https://example.com/hooks',
];
WebhooksUpdate.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
    include: command_1.flags.string({ char: 'i', description: 'comma delimited event types your server will receive ', required: true }),
    level: command_1.flags.string({ char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true }),
    secret: command_1.flags.string({ char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header' }),
    authorization: command_1.flags.string({ char: 't', description: 'authoriation header to send with webhooks' }),
    url: command_1.flags.string({ char: 'u', description: 'URL for receiver', required: true }),
};
WebhooksUpdate.args = [
    { name: 'id', required: true },
];
