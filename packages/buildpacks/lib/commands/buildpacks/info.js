"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const true_myth_1 = require("true-myth");
const buildpack_registry_1 = require("@heroku/buildpack-registry");
class Info extends command_1.Command {
    async run() {
        const { args } = await this.parse(Info);
        const registry = new buildpack_registry_1.BuildpackRegistry();
        true_myth_1.Result.match({
            Ok: _ => { },
            Err: err => {
                this.error(`Could not publish the buildpack.\n${err}`);
            },
        }, buildpack_registry_1.BuildpackRegistry.isValidBuildpackSlug(args.buildpack));
        const result = await registry.info(args.buildpack);
        true_myth_1.Result.match({
            Ok: buildpack => {
                core_1.CliUx.ux.styledHeader(args.buildpack);
                core_1.CliUx.ux.styledObject(buildpack, ['description', 'category', 'license', 'support', 'source', 'readme']);
            },
            Err: err => {
                if (err.status === 404) {
                    core_1.CliUx.ux.error(`Could not find the buildpack '${args.buildpack}'`);
                }
                else {
                    core_1.CliUx.ux.error(`Problems finding buildpack info: ${err.description}`);
                }
            },
        }, result);
    }
}
exports.default = Info;
Info.description = 'fetch info about a buildpack';
Info.args = [
    {
        name: 'buildpack',
        required: true,
        description: 'namespace/name of the buildpack',
    },
];
