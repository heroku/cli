"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const api_1 = require("../api");
const cli = core_1.CliUx.ux;
function createApp(heroku, { archiveURL, name, organization, pipeline, stage }) {
    const params = {
        source_blob: { url: archiveURL },
        app: { name },
        pipeline_coupling: {
            stage,
            pipeline: pipeline.id,
        },
    };
    if (organization) {
        params.app.organization = organization;
    }
    else {
        params.app.personal = true;
    }
    return (0, api_1.createAppSetup)(heroku, params).then(setup => setup);
}
function createApps(heroku, archiveURL, pipeline, pipelineName, stagingAppName, organization) {
    const prodAppSetupPromise = createApp(heroku, {
        archiveURL,
        pipeline,
        name: pipelineName,
        stage: 'production',
        organization,
    });
    const stagingAppSetupPromise = createApp(heroku, {
        archiveURL,
        pipeline,
        name: stagingAppName,
        stage: 'staging',
        organization,
    });
    const promises = [prodAppSetupPromise, stagingAppSetupPromise];
    return Promise.all(promises).then(appSetups => {
        return appSetups;
    }, error => {
        cli.error(error, { exit: 1 });
    });
}
exports.default = createApps;
