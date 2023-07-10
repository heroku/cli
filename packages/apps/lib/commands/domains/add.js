"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const spinner_1 = require("@oclif/core/lib/cli-ux/action/spinner");
const inquirer_1 = require("inquirer");
const shellescape = require("shell-escape");
const wait_for_domain_1 = require("../../lib/wait-for-domain");
const cli = core_1.CliUx.ux;
class DomainsAdd extends command_1.Command {
    constructor() {
        super(...arguments);
        this.certSelect = async (certs) => {
            const nullCertChoice = {
                name: 'No SNI Endpoint',
                value: null,
            };
            const certChoices = certs.map((cert) => {
                const certName = cert.displayName || cert.name;
                const domainsLength = cert.ssl_cert.cert_domains.length;
                if (domainsLength) {
                    let domainsList = cert.ssl_cert.cert_domains.slice(0, 4).join(', ');
                    if (domainsLength > 5) {
                        domainsList = `${domainsList} (...and ${domainsLength - 4} more)`;
                    }
                    domainsList = `${certName} -> ${domainsList}`;
                    return {
                        name: domainsList,
                        value: cert.name,
                    };
                }
                return {
                    name: certName,
                    value: cert.name,
                };
            });
            const selection = await (0, inquirer_1.prompt)([
                {
                    type: 'list',
                    name: 'cert',
                    message: 'Choose an SNI endpoint to associate with this domain',
                    choices: [nullCertChoice, ...certChoices],
                },
            ]);
            return selection.cert;
        };
    }
    async run() {
        const { args, flags } = await this.parse(DomainsAdd);
        const { hostname } = args;
        const action = new spinner_1.default();
        const domainCreatePayload = {
            hostname,
            sni_endpoint: null,
        };
        let certs = [];
        action.start(`Adding ${color_1.color.green(domainCreatePayload.hostname)} to ${color_1.color.app(flags.app)}`);
        if (flags.cert) {
            domainCreatePayload.sni_endpoint = flags.cert;
        }
        else {
            const { body } = await this.heroku.get(`/apps/${flags.app}/sni-endpoints`);
            certs = [...body];
        }
        if (certs.length > 1) {
            action.stop('resolving SNI endpoint');
            const certSelection = await this.certSelect(certs);
            if (certSelection) {
                domainCreatePayload.sni_endpoint = certSelection;
            }
            action.start(`Adding ${color_1.color.green(domainCreatePayload.hostname)} to ${color_1.color.app(flags.app)}`);
        }
        try {
            const { body: domain } = await this.heroku.post(`/apps/${flags.app}/domains`, {
                body: domainCreatePayload,
            });
            if (flags.json) {
                cli.styledJSON(domain);
            }
            else {
                cli.log(`Configure your app's DNS provider to point to the DNS Target ${color_1.color.green(domain.cname || '')}.
    For help, see https://devcenter.heroku.com/articles/custom-domains`);
                if (domain.status !== 'none') {
                    if (flags.wait) {
                        await (0, wait_for_domain_1.default)(flags.app, this.heroku, domain);
                    }
                    else {
                        cli.log('');
                        cli.log(`The domain ${color_1.color.green(hostname)} has been enqueued for addition`);
                        const command = `heroku domains:wait ${shellescape([hostname])}`;
                        cli.log(`Run ${color_1.color.cmd(command)} to wait for completion`);
                    }
                }
            }
        }
        catch (error) {
            cli.error(error);
        }
        finally {
            action.stop();
        }
    }
}
exports.default = DomainsAdd;
DomainsAdd.description = 'add a domain to an app';
DomainsAdd.examples = ['heroku domains:add www.example.com'];
DomainsAdd.flags = {
    help: command_1.flags.help({ char: 'h' }),
    app: command_1.flags.app({ required: true }),
    cert: command_1.flags.string({ description: 'the name of the SSL cert you want to use for this domain', char: 'c' }),
    json: command_1.flags.boolean({ description: 'output in json format', char: 'j' }),
    wait: command_1.flags.boolean(),
    remote: command_1.flags.remote(),
};
DomainsAdd.args = [{ name: 'hostname', required: true }];
