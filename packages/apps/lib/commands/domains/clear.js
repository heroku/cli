"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
class DomainsClear extends command_1.Command {
    async run() {
        const { flags } = await this.parse(DomainsClear);
        const action = new spinner_1.default();
        action.start(`Removing all domains from ${color_1.color.app(flags.app)}`);
        let { body: domains } = await this.heroku.get(`/apps/${flags.app}/domains`);
        domains = domains.filter((d) => d.kind === 'custom');
        for (const domain of domains) {
            await this.heroku.delete(`/apps/${flags.app}/domains/${domain.hostname}`);
        }
        action.stop();
    }
}
exports.default = DomainsClear;
DomainsClear.description = 'remove all domains from an app';
DomainsClear.examples = ['heroku domains:clear'];
DomainsClear.flags = {
    help: command_1.flags.help({ char: 'h' }),
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
