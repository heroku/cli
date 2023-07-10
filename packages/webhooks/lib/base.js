"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
class default_1 extends command_1.Command {
    constructor(argv, config) {
        super(argv, config);
        const client = new command_1.APIClient(this.config, {});
        client.defaults.headers = Object.assign(Object.assign({}, this.heroku.defaults.headers), { Accept: 'application/vnd.heroku+json; version=3.webhooks', authorization: `Basic ${Buffer.from(':' + this.heroku.auth).toString('base64')}` });
        this.webhooksClient = client;
    }
    webhookType(context) {
        if (context.pipeline) {
            return {
                path: `/pipelines/${context.pipeline}`,
                display: context.pipeline,
            };
        }
        if (context.app) {
            return {
                path: `/apps/${context.app}`,
                display: color_1.default.app(context.app),
            };
        }
        return this.error('No app specified');
    }
}
exports.default = default_1;
