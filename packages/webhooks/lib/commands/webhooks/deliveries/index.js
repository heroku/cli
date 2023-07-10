"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const base_1 = require("../../../base");
class Deliveries extends base_1.default {
    async run() {
        const { flags } = await this.parse(Deliveries);
        const webhookType = this.webhookType(flags);
        let { path } = webhookType;
        const { display } = webhookType;
        const max = 1000;
        path = `${path}/webhook-deliveries`;
        if (flags.status) {
            path += `?eq[status]=${encodeURIComponent(flags.status)}`;
        }
        const { body: deliveries } = await this.webhooksClient.get(path, {
            headers: {
                Range: `seq ..; order=desc,max=${max}`,
            },
            partial: true,
        });
        if (deliveries.length === 0) {
            this.log(`${display} has no deliveries`);
        }
        else {
            const code = (w) => {
                return (w.last_attempt && w.last_attempt.code && String(w.last_attempt.code)) || '';
            };
            deliveries.reverse();
            if (deliveries.length === max) {
                this.warn(`Only showing the ${max} most recent deliveries`);
                this.warn('It is possible to filter deliveries by using the --status flag');
            }
            const printLine = (...args) => this.log(...args);
            core_1.CliUx.ux.table(deliveries, {
                id: {
                    header: 'Delivery ID',
                },
                created_at: {
                    header: 'Created', get: (w) => w.created_at,
                },
                status: {
                    get: (w) => w.status,
                },
                include: {
                    get: (w) => w.event.include,
                },
                level: {
                    get: (w) => w.webhook.level,
                },
                num_attempts: {
                    header: 'Attempts', get: (w) => String(w.num_attempts),
                },
                last_code: {
                    header: 'Code', get: code,
                },
                last_error: {
                    header: 'Error', get: (w) => (w.last_attempt && w.last_attempt.error_class) || '',
                },
                next_attempt_at: {
                    header: 'Next Attempt', get: (w) => w.next_attempt_at || '',
                },
            }, {
                'no-header': false, printLine,
            });
        }
    }
}
exports.default = Deliveries;
Deliveries.description = 'list webhook deliveries on an app';
Deliveries.examples = [
    '$ heroku webhooks:deliveries',
];
Deliveries.flags = {
    app: command_1.flags.app(),
    remote: command_1.flags.remote(),
    status: command_1.flags.string({ char: 's', description: 'filter deliveries by status' }),
    pipeline: command_1.flags.pipeline({ char: 'p', description: 'pipeline on which to list', hidden: true }),
};
