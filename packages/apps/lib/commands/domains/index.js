"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const Uri = require("urijs");
const cli = core_1.CliUx.ux;
function isApexDomain(hostname) {
    if (hostname.includes('*'))
        return false;
    const a = new Uri({ protocol: 'http', hostname });
    return a.subdomain() === '';
}
class DomainsIndex extends command_1.Command {
    constructor() {
        super(...arguments);
        this.tableConfig = (needsEndpoints) => {
            const tableConfig = {
                hostname: {
                    header: 'Domain Name',
                },
                kind: {
                    header: 'DNS Record Type',
                    get: (domain) => {
                        if (domain.hostname) {
                            return isApexDomain(domain.hostname) ? 'ALIAS or ANAME' : 'CNAME';
                        }
                    },
                },
                cname: { header: 'DNS Target' },
                acm_status: { header: 'ACM Status', extended: true },
                acm_status_reason: { header: 'ACM Status', extended: true },
            };
            const sniConfig = {
                sni_endpoint: {
                    header: 'SNI Endpoint',
                    get: (domain) => {
                        if (domain.sni_endpoint) {
                            return domain.sni_endpoint.name;
                        }
                    },
                },
            };
            if (needsEndpoints) {
                return Object.assign(Object.assign({}, tableConfig), sniConfig);
            }
            return tableConfig;
        };
    }
    async run() {
        const { flags } = await this.parse(DomainsIndex);
        const { body: domains } = await this.heroku.get(`/apps/${flags.app}/domains`);
        const herokuDomain = domains.find(domain => domain.kind === 'heroku');
        const customDomains = domains.filter(domain => domain.kind === 'custom');
        if (flags.json) {
            cli.styledJSON(domains);
        }
        else {
            cli.styledHeader(`${flags.app} Heroku Domain`);
            cli.log(herokuDomain && herokuDomain.hostname);
            if (customDomains && customDomains.length > 0) {
                cli.log();
                cli.styledHeader(`${flags.app} Custom Domains`);
                cli.table(customDomains, this.tableConfig(true), Object.assign(Object.assign({}, flags), { 'no-truncate': true }));
            }
        }
    }
}
exports.default = DomainsIndex;
DomainsIndex.description = 'list domains for an app';
DomainsIndex.examples = [
    `$ heroku domains
=== example Heroku Domain
example-xxxxxxxxxxxx.herokuapp.com

=== example Custom Domains
Domain Name      DNS Record Type  DNS Target
www.example.com  CNAME            www.example.herokudns.com
`, "$ heroku domains --filter 'Domain Name=www.example.com'",
];
DomainsIndex.flags = Object.assign({ help: command_1.flags.help({ char: 'h' }), app: command_1.flags.app({ required: true }), remote: command_1.flags.remote(), json: command_1.flags.boolean({ description: 'output in json format', char: 'j' }) }, cli.table.flags({ except: 'no-truncate' }));
