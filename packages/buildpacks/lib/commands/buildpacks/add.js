"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const buildpacks_1 = require("../../buildpacks");
class Add extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(Add);
        const buildpackCommand = new buildpacks_1.BuildpackCommand(this.heroku);
        if (flags.index !== undefined) {
            buildpackCommand.validateIndex(flags.index);
        }
        const buildpacks = await buildpackCommand.fetch(flags.app);
        await buildpackCommand.validateUrlNotSet(buildpacks, args.buildpack);
        let spliceIndex;
        if (flags.index === undefined) {
            spliceIndex = buildpacks.length;
        }
        else {
            // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
            const foundIndex = buildpackCommand.findIndex(buildpacks, flags.index);
            spliceIndex = (foundIndex === -1) ? buildpacks.length : foundIndex;
        }
        const buildpackUpdates = await buildpackCommand.mutate(flags.app, buildpacks, spliceIndex, args.buildpack, 'add');
        buildpackCommand.displayUpdate(flags.app, flags.remote || '', buildpackUpdates, 'added');
    }
}
exports.default = Add;
Add.description = 'add new app buildpack, inserting into list of buildpacks if necessary';
Add.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    index: command_1.flags.integer({
        description: 'the 1-based index of the URL in the list of URLs',
        char: 'i',
    }),
};
Add.args = [
    {
        name: 'buildpack',
        required: true,
        description: 'namespace/name of the buildpack',
    },
];
