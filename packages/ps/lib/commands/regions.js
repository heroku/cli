"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const color_1 = require("@heroku-cli/color");
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const _ = require("lodash");
class Regions extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Regions);
        let { body: regions } = await this.heroku.get('/regions');
        if (flags.private) {
            regions = regions.filter((region) => region.private_capable);
        }
        else if (flags.common) {
            regions = regions.filter((region) => !region.private_capable);
        }
        regions = _.sortBy(regions, ['private_capable', 'name']);
        if (flags.json) {
            core_1.CliUx.ux.styledJSON(regions);
        }
        else {
            core_1.CliUx.ux.table(regions, {
                name: {
                    header: 'ID',
                    get: ({ name }) => color_1.default.green(name),
                },
                description: {
                    header: 'Location',
                },
                private_capable: {
                    header: 'Runtime',
                    get: ({ private_capable }) => private_capable ? 'Private Spaces' : 'Common Runtime',
                },
            });
        }
    }
}
exports.default = Regions;
Regions.topic = 'regions';
Regions.description = 'list available regions for deployment';
Regions.flags = {
    json: command_1.flags.boolean({ description: 'output in json format' }),
    private: command_1.flags.boolean({ description: 'show regions for private spaces' }),
    common: command_1.flags.boolean({ description: 'show regions for common runtime' }),
};
