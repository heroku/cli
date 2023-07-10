"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const core_1 = require("@oclif/core");
const lodash_sortby_1 = tslib_1.__importDefault(require("lodash.sortby"));
const ownership_1 = require("./ownership");
const cli = core_1.CliUx.ux;
async function renderPipeline(heroku, pipeline, pipelineApps, 
// eslint-disable-next-line unicorn/no-object-as-default-parameter
{ withOwners, showOwnerWarning } = { withOwners: false, showOwnerWarning: false }) {
    cli.styledHeader(pipeline.name);
    let owner;
    if (pipeline.owner) {
        owner = await (0, ownership_1.getOwner)(heroku, pipelineApps, pipeline);
        cli.log(`owner: ${owner}`);
    }
    cli.log('');
    const columns = {
        name: {
            header: 'app name',
            get(row) {
                return color_1.default.app(row.name || '');
            },
        },
        'coupling.stage': {
            header: 'stage',
            get(row) {
                return row.coupling.stage;
            },
        },
    };
    if (withOwners) {
        columns['owner.email'] = {
            header: 'owner',
            get(row) {
                const email = row.owner && row.owner.email;
                if (email) {
                    return email.endsWith('@herokumanager.com') ? `${row.split('@')[0]} (team)` : email;
                }
            },
        };
    }
    const developmentApps = (0, lodash_sortby_1.default)(pipelineApps.filter(app => app.coupling.stage === 'development'), ['name']);
    const reviewApps = (0, lodash_sortby_1.default)(pipelineApps.filter(app => app.coupling.stage === 'review'), ['name']);
    const stagingApps = (0, lodash_sortby_1.default)(pipelineApps.filter(app => app.coupling.stage === 'staging'), ['name']);
    const productionApps = (0, lodash_sortby_1.default)(pipelineApps.filter(app => app.coupling.stage === 'production'), ['name']);
    const apps = developmentApps.concat(reviewApps).concat(stagingApps).concat(productionApps);
    cli.table(apps, columns);
    if (showOwnerWarning && pipeline.owner) {
        (0, ownership_1.warnMixedOwnership)(pipelineApps, pipeline, owner);
    }
}
exports.default = renderPipeline;
