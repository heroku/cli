"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const wait_for_domain_1 = require("../../lib/wait-for-domain");
class DomainsWait extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(DomainsWait);
        let domains;
        if (args.hostname) {
            const { body: domain } = await this.heroku.get(`/apps/${flags.app}/domains/${args.hostname}`);
            domains = [domain];
        }
        else {
            const { body: apiDomains } = await this.heroku.get(`/apps/${flags.app}/domains`);
            domains = apiDomains.filter(domain => domain.status === 'pending');
        }
        for (const domain of domains) {
            await (0, wait_for_domain_1.default)(flags.app, this.heroku, domain);
        }
    }
}
exports.default = DomainsWait;
DomainsWait.description = 'wait for domain to be active for an app';
DomainsWait.flags = {
    help: command_1.flags.help({ char: 'h' }),
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
DomainsWait.args = [{ name: 'hostname' }];
