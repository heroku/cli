"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const api_1 = require("../../api");
const cli = core_1.CliUx.ux;
class PipelinesRemove extends command_1.Command {
    async run() {
        const { flags: { app } } = await this.parse(PipelinesRemove);
        cli.action.start(`Removing ${color_1.default.app(app)}`);
        await (0, api_1.removeCoupling)(this.heroku, app);
        cli.action.stop();
    }
}
exports.default = PipelinesRemove;
PipelinesRemove.description = 'remove this app from its pipeline';
PipelinesRemove.examples = [
    '$ heroku pipelines:remove -a my-app',
];
PipelinesRemove.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
