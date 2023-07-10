"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const cli = core_1.CliUx.ux;
function setupPipeline(kolkrabbi, app, settings, pipelineID, ciSettings = {}) {
    const promises = [kolkrabbi.updateAppLink(app, settings)];
    if (ciSettings.ci) {
        promises.push(kolkrabbi.updatePipelineRepository(pipelineID, ciSettings));
    }
    return Promise.all(promises).then(([appLink]) => {
        return appLink;
    }, error => {
        cli.error(error.body.message || error.message);
    });
}
exports.default = setupPipeline;
