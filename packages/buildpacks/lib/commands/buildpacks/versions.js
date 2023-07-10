"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const true_myth_1 = require("true-myth");
const buildpack_registry_1 = require("@heroku/buildpack-registry");
class Versions extends command_1.Command {
    async run() {
        const { args } = await this.parse(Versions);
        const herokuAuth = this.heroku.auth || '';
        if (herokuAuth === '') {
            this.error('You need to be logged in to run this command.');
        }
        const registry = new buildpack_registry_1.BuildpackRegistry();
        true_myth_1.Result.match({
            Ok: _ => { },
            Err: err => {
                this.error(`Could not find the buildpack.\n${err}`);
            },
        }, buildpack_registry_1.BuildpackRegistry.isValidBuildpackSlug(args.buildpack));
        const result = await registry.listVersions(args.buildpack);
        true_myth_1.Result.match({
            Ok: versions => {
                core_1.CliUx.ux.table(versions.sort((a, b) => {
                    return a.release > b.release ? -1 : 1;
                }), {
                    release: {
                        header: 'Version',
                    },
                    created_at: {
                        header: 'Released At',
                    },
                    status: {
                        header: 'Status',
                    },
                });
            },
            Err: err => {
                if (err.status === 404) {
                    this.error(`Could not find '${args.buildpack}'`);
                }
                else {
                    this.error(`Problem fetching versions, ${err.status}: ${err.description}`);
                }
            },
        }, result);
    }
}
exports.default = Versions;
Versions.description = 'list versions of a buildpack';
Versions.args = [
    {
        name: 'buildpack',
        required: true,
        description: 'namespace/name of the buildpack',
    },
];
