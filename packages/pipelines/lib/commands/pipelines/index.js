"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const cli = core_1.CliUx.ux;
class Pipelines extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Pipelines);
        const { body: pipelines } = await this.heroku.get('/pipelines');
        if (flags.json) {
            cli.styledJSON(pipelines);
        }
        else {
            cli.styledHeader('My Pipelines');
            for (const pipeline of pipelines) {
                cli.log(pipeline.name);
            }
        }
    }
}
exports.default = Pipelines;
Pipelines.description = 'list pipelines you have access to';
Pipelines.examples = [
    '$ heroku pipelines',
];
Pipelines.flags = {
    json: command_1.flags.boolean({ description: 'output in json format' }),
};
