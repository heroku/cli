"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const buildpacks_1 = require("../../buildpacks");
class Clear extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Clear);
        const buildpackCommand = new buildpacks_1.BuildpackCommand(this.heroku);
        await buildpackCommand.clear(flags.app, 'clear', 'cleared');
    }
}
exports.default = Clear;
Clear.description = 'clear all buildpacks set on the app';
Clear.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
