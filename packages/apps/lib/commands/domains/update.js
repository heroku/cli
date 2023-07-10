"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
class DomainsUpdate extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(DomainsUpdate);
        const { hostname } = args;
        const action = new spinner_1.default();
        try {
            action.start(`Updating ${color_1.color.cyan(hostname)} to use ${color_1.color.cyan(flags.cert)} certificate`);
            await this.heroku.patch(`/apps/${flags.app}/domains/${hostname}`, {
                body: { sni_endpoint: flags.cert },
            });
        }
        catch (error) {
            core_1.CliUx.ux.error(error);
        }
        finally {
            action.stop();
        }
    }
}
exports.default = DomainsUpdate;
DomainsUpdate.description = 'update a domain to use a different SSL certificate on an app';
DomainsUpdate.examples = ['heroku domains:update www.example.com --cert mycert'];
DomainsUpdate.flags = {
    help: command_1.flags.help({ char: 'h' }),
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    cert: command_1.flags.string({
        required: true,
        description: 'the name or id of the certificate you want to use for this domain',
    }),
};
DomainsUpdate.args = [{ name: 'hostname' }];
