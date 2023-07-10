"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const buildpacks_1 = require("../../buildpacks");
class Remove extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(Remove);
        const buildpackCommand = new buildpacks_1.BuildpackCommand(this.heroku);
        if (flags.index && args.buildpack) {
            core_1.CliUx.ux.error('Please choose either index or Buildpack, but not both.', { exit: 1 });
        }
        if (!flags.index && !args.buildpack) {
            core_1.CliUx.ux.error('Usage: heroku buildpacks:remove [BUILDPACK_URL]. Must specify a buildpack to remove, either by index or URL.');
        }
        const buildpacks = await buildpackCommand.fetch(flags.app);
        if (buildpacks.length === 0) {
            core_1.CliUx.ux.error(`No buildpacks were found. Next release on ${flags.app} will detect buildpack normally.`, { exit: 1 });
        }
        let spliceIndex;
        if (flags.index) {
            buildpackCommand.validateIndexInRange(buildpacks, flags.index);
            // eslint-disable-next-line unicorn/no-array-method-this-argument
            spliceIndex = await buildpackCommand.findIndex(buildpacks, flags.index);
        }
        else {
            spliceIndex = await buildpackCommand.findUrl(buildpacks, args.buildpack);
        }
        if (spliceIndex === -1) {
            core_1.CliUx.ux.error('Buildpack not found. Nothing was removed.', { exit: 1 });
        }
        if (buildpacks.length === 1) {
            await buildpackCommand.clear(flags.app, 'remove', 'removed');
        }
        else {
            const buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'remove');
            buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'removed');
        }
    }
}
exports.default = Remove;
Remove.description = 'remove a buildpack set on the app';
Remove.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    index: command_1.flags.integer({
        description: 'the 1-based index of the URL to remove from the list of URLs',
        char: 'i',
    }),
};
Remove.args = [
    {
        name: 'buildpack',
        description: 'namespace/name of the buildpack',
    },
];
