"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const base_1 = require("../../base");
class WebhooksInfo extends base_1.default {
    async run() {
        const { flags, args } = await this.parse(WebhooksInfo);
        const { path } = this.webhookType(flags);
        const { body: webhook } = await this.webhooksClient.get(`${path}/webhooks/${args.id}`);
        const obj = {
            'Webhook ID': webhook.id,
            URL: webhook.url,
            Include: webhook.include.join(','),
            Level: webhook.level,
        };
        core_1.CliUx.ux.styledHeader(webhook.id);
        core_1.CliUx.ux.styledObject(obj);
    }
}
exports.default = WebhooksInfo;
WebhooksInfo.description = 'info for a webhook on an app';
WebhooksInfo.example = ['$ heroku webhooks:info 99999999-9999-9999-9999-999999999999'];
WebhooksInfo.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
};
WebhooksInfo.args = [{ name: 'id', required: true }];
