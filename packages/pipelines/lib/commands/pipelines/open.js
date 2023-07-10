"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const disambiguate_1 = tslib_1.__importDefault(require("../../disambiguate"));
const cli = core_1.CliUx.ux;
class Open extends command_1.Command {
    async run() {
        const { args } = await this.parse(Open);
        const pipeline = await (0, disambiguate_1.default)(this.heroku, args.pipeline);
        await cli.open(`https://dashboard.heroku.com/pipelines/${pipeline.id}`);
    }
}
exports.default = Open;
Open.description = 'open a pipeline in dashboard';
Open.examples = ['$ heroku pipelines:open my-pipeline'];
Open.args = [{
        name: 'pipeline', description: 'name of pipeline', required: true,
    }];
