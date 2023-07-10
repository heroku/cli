"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
class DomainsRemove extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(DomainsRemove);
        const action = new spinner_1.default();
        action.start(`Removing ${color_1.color.green(args.hostname)} from ${color_1.color.app(flags.app)}`);
        await this.heroku.delete(`/apps/${flags.app}/domains/${args.hostname}`);
        action.stop();
    }
}
exports.default = DomainsRemove;
DomainsRemove.description = 'remove a domain from an app';
DomainsRemove.examples = ['heroku domains:remove www.example.com'];
DomainsRemove.flags = {
    help: command_1.flags.help({ char: 'h' }),
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
DomainsRemove.args = [{ name: 'hostname', required: true }];
