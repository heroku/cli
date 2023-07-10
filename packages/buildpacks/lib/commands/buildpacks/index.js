"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const buildpacks_1 = require("../../buildpacks");
class Index extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Index);
        const buildpacksCommand = new buildpacks_1.BuildpackCommand(this.heroku);
        const buildpacks = await buildpacksCommand.fetch(flags.app);
        if (buildpacks.length === 0) {
            this.log(`${flags.app} has no Buildpack URL set.`);
        }
        else {
            core_1.CliUx.ux.styledHeader(`${flags.app} Buildpack URL${buildpacks.length > 1 ? 's' : ''}`);
            buildpacksCommand.display(buildpacks, '');
        }
    }
}
exports.default = Index;
Index.description = 'display the buildpacks for an app';
Index.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
};
