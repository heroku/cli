"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const buildpacks_1 = require("../../buildpacks");
class Set extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(Set);
        if (flags.index && flags.index < 0) {
            this.error('Invalid index. Must be greater than 0.');
        }
        const buildpackCommand = new buildpacks_1.BuildpackCommand(this.heroku);
        const buildpacks = await buildpackCommand.fetch(flags.app);
        await buildpackCommand.validateUrlNotSet(buildpacks, args.buildpack);
        let spliceIndex;
        if (flags.index === undefined) {
            spliceIndex = 0;
        }
        else {
            // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
            const foundIndex = buildpackCommand.findIndex(buildpacks, flags.index);
            spliceIndex = (foundIndex === -1) ? buildpacks.length : foundIndex;
        }
        const buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'set');
        buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'set');
    }
}
exports.default = Set;
Set.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    index: command_1.flags.integer({
        description: 'the 1-based index of the URL in the list of URLs',
        char: 'i',
    }),
};
Set.args = [
    {
        name: 'buildpack',
        required: true,
        description: 'namespace/name of the buildpack',
    },
];
