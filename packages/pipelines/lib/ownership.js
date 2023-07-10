"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOwner = exports.warnMixedOwnership = void 0;
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const core_1 = require("@oclif/core");
const api_1 = require("./api");
const cli = core_1.CliUx.ux;
function warnMixedOwnership(pipelineApps, pipeline, owner) {
    const hasMixedOwnership = pipelineApps.some(app => {
        return (app.owner && app.owner.id) !== pipeline.owner.id;
    });
    if (hasMixedOwnership) {
        cli.log();
        let message = `Some apps in this pipeline do not belong to ${color_1.default.cmd(owner)}.`;
        message += '\n\nAll apps in a pipeline must have the same owner as the pipeline owner.';
        message += '\nTransfer these apps or change the pipeline owner in pipeline settings.';
        message += `\nSee ${color_1.default.cyan('https://devcenter.heroku.com/articles/pipeline-ownership-transition')} for more info.`;
        cli.warn(message);
    }
}
exports.warnMixedOwnership = warnMixedOwnership;
function getOwner(heroku, apps, pipeline) {
    let owner;
    let ownerPromise;
    if (pipeline.owner.type === 'team') {
        ownerPromise = (0, api_1.getTeam)(heroku, pipeline.owner.id).then(response => response.body);
    }
    else {
        const app = apps.find(app => {
            return app.owner ? app.owner.id === pipeline.owner.id : false;
        });
        // If pipeline owner doesn't own any application and type is user (unlikely)
        // We return the uuid as default
        owner = app ? app.owner && app.owner.email : pipeline.owner.id;
        ownerPromise = Promise.resolve(owner);
    }
    return ownerPromise.then(owner => {
        return owner.name ? `${owner.name} (team)` : owner;
    });
}
exports.getOwner = getOwner;
