"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
const base_1 = require("../../base");
class WebhooksAdd extends base_1.default {
    async run() {
        const { flags } = await this.parse(WebhooksAdd);
        const { path, display } = this.webhookType(flags);
        const action = new spinner_1.default();
        action.start(`Adding webhook to ${display}`);
        const response = await this.webhooksClient.post(`${path}/webhooks`, {
            body: {
                include: flags.include.split(',').map(s => s.trim()),
                level: flags.level,
                secret: flags.secret,
                url: flags.url,
                authorization: flags.authorization,
            },
        });
        const secret = response.headers && response.headers['heroku-webhook-secret'];
        if (secret) {
            core_1.CliUx.ux.styledHeader('Webhooks Signing Secret');
            this.log(secret);
        }
        else {
            core_1.CliUx.ux.warn('no secret found');
        }
        action.stop();
    }
}
exports.default = WebhooksAdd;
WebhooksAdd.description = 'add a webhook to an app';
WebhooksAdd.examples = [
    '$ heroku webhooks:add -i api:dyno -l notify -u https://example.com/hooks',
];
WebhooksAdd.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
    include: command_1.flags.string({ char: 'i', description: 'comma delimited event types your server will receive ', required: true }),
    level: command_1.flags.string({ char: 'l', description: 'notify does not retry, sync will retry until successful or timeout', required: true }),
    secret: command_1.flags.string({ char: 's', description: 'value to sign delivery with in Heroku-Webhook-Hmac-SHA256 header' }),
    authorization: command_1.flags.string({ char: 't', description: 'authoriation header to send with webhooks' }),
    url: command_1.flags.string({ char: 'u', description: 'URL for receiver', required: true }),
};
