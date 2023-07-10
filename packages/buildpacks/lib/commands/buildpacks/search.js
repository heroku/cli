"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const buildpack_registry_1 = require("@heroku/buildpack-registry");
class Search extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(Search);
        let searchResults;
        const registry = new buildpack_registry_1.BuildpackRegistry();
        if (args.term) {
            const uniqueBuildpacks = new Map();
            const array = ((await registry.search(args.term)).unwrapOr([]))
                .concat((await registry.search(undefined, args.term)).unwrapOr([]))
                .concat((await registry.search(undefined, undefined, args.term)).unwrapOr([]));
            array
                .forEach((element) => {
                uniqueBuildpacks.set(`${element.namespace}/${element.name}`, element);
            });
            searchResults = [...uniqueBuildpacks.values()];
        }
        else {
            searchResults = (await registry.search(flags.namespace, flags.name, flags.description)).unwrapOr([]);
        }
        const buildpacks = searchResults.map((buildpack) => {
            return {
                buildpack: `${buildpack.namespace}/${buildpack.name}`,
                category: buildpack.category,
                description: buildpack.description,
            };
        });
        const displayTable = (buildpacks) => {
            core_1.CliUx.ux.table(buildpacks, {
                buildpack: {
                    header: 'Buildpack',
                },
                category: {
                    header: 'Category',
                },
                description: {
                    header: 'Description',
                },
            });
        };
        if (buildpacks.length === 0) {
            core_1.CliUx.ux.log('No buildpacks found');
        }
        else if (buildpacks.length === 1) {
            displayTable(buildpacks);
            core_1.CliUx.ux.log('\n1 buildpack found');
        }
        else {
            displayTable(buildpacks);
            core_1.CliUx.ux.log(`\n${buildpacks.length} buildpacks found`);
        }
    }
}
exports.default = Search;
Search.description = 'search for buildpacks';
Search.flags = {
    namespace: command_1.flags.string({ description: 'buildpack namespaces to filter on using a comma separated list' }),
    name: command_1.flags.string({ description: 'buildpack names to filter on using a comma separated list ' }),
    description: command_1.flags.string({ description: 'buildpack description to filter on' }),
};
Search.args = [
    {
        name: 'term',
        description: 'search term that searches across name, namespace, and description',
    },
];
