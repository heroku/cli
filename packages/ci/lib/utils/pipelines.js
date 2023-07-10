"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPipeline = exports.disambiguatePipeline = void 0;
const inquirer_1 = require("inquirer");
const validator_1 = require("validator");
async function disambiguatePipeline(pipelineIDOrName, command) {
    const headers = { Accept: 'application/vnd.heroku+json; version=3.pipelines' };
    if ((0, validator_1.isUUID)(pipelineIDOrName)) {
        const { body: pipeline } = await command.heroku.get(`/pipelines/${pipelineIDOrName}`, { headers });
        return pipeline;
    }
    const { body: pipelines } = await command.heroku.get(`/pipelines?eq[name]=${pipelineIDOrName}`, { headers });
    let choices;
    let questions;
    switch (pipelines.length) {
        case 0:
            command.error('Pipeline not found');
            break;
        case 1:
            return pipelines[0];
        default:
            choices = pipelines.map(function (x) {
                return { name: new Date(x.created_at), value: x };
            });
            questions = [{
                    type: 'list',
                    name: 'pipeline',
                    message: `Which ${pipelineIDOrName} pipeline?`,
                    choices,
                }];
            return (0, inquirer_1.prompt)(questions);
    }
}
exports.disambiguatePipeline = disambiguatePipeline;
async function getPipeline(flags, command) {
    let pipeline;
    if ((!flags.pipeline) && (!flags.app)) {
        command.error('Required flag:  --pipeline PIPELINE or --app APP');
    }
    if (flags && flags.pipeline) {
        pipeline = await disambiguatePipeline(flags.pipeline, command);
        if (pipeline.pipeline) {
            pipeline = pipeline.pipeline;
        } // in case prompt returns an object like { pipeline: { ... } }
    }
    else {
        const { body: coupling } = await command.heroku.get(`/apps/${flags.app}/pipeline-couplings`);
        if ((coupling) && (coupling.pipeline)) {
            pipeline = coupling.pipeline;
        }
        else {
            command.error(`No pipeline found with application ${flags.app}`);
        }
    }
    return pipeline;
}
exports.getPipeline = getPipeline;
