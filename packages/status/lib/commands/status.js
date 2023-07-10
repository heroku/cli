"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const core_1 = require("@oclif/core");
const distanceInWordsToNow = require("date-fns/distance_in_words_to_now");
const http_call_1 = require("http-call");
const util_1 = require("../util");
const capitalize = (str) => str.slice(0, 1).toUpperCase() + str.slice(1);
const printStatus = (status) => {
    const colorize = color_1.default[status];
    let message = capitalize(status);
    if (status === 'green') {
        message = 'No known issues at this time.';
    }
    return colorize(message);
};
class Status extends core_1.Command {
    async run() {
        const { flags } = await this.parse(Status);
        const apiPath = '/api/v4/current-status';
        const host = process.env.HEROKU_STATUS_HOST || 'https://status.heroku.com';
        const { body } = await http_call_1.default.get(host + apiPath);
        if (flags.json) {
            core_1.CliUx.ux.styledJSON(body);
            return;
        }
        for (const item of body.status) {
            const message = printStatus(item.status);
            this.log(`${(item.system + ':').padEnd(11)}${message}`);
        }
        for (const incident of body.incidents) {
            core_1.CliUx.ux.log();
            core_1.CliUx.ux.styledHeader(`${incident.title} ${color_1.default.yellow(incident.created_at)} ${color_1.default.cyan(incident.full_url)}`);
            const padding = (0, util_1.maxBy)(incident.updates, (i) => i.update_type.length).update_type.length + 0;
            for (const u of incident.updates) {
                core_1.CliUx.ux.log(`${color_1.default.yellow(u.update_type.padEnd(padding))} ${new Date(u.updated_at).toISOString()} (${distanceInWordsToNow(new Date(u.updated_at))} ago)`);
                core_1.CliUx.ux.log(`${u.contents}\n`);
            }
        }
    }
}
exports.default = Status;
Status.description = 'display current status of the Heroku platform';
Status.flags = {
    json: core_1.Flags.boolean({ description: 'output in json format' }),
};
