"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = require("inquirer");
const validator_1 = require("validator");
const api_1 = require("./api");
async function disambiguate(heroku, pipelineIDOrName) {
    let pipeline;
    if ((0, validator_1.isUUID)(pipelineIDOrName)) {
        const result = (await (0, api_1.getPipeline)(heroku, pipelineIDOrName));
        pipeline = result.body;
    }
    else {
        const { body: pipelines } = await (0, api_1.findPipelineByName)(heroku, pipelineIDOrName);
        if (pipelines.length === 0) {
            throw new Error('Pipeline not found');
        }
        else if (pipelines.length === 1) {
            pipeline = pipelines[0];
        }
        else {
            // Disambiguate
            const choices = pipelines.map(x => {
                return {
                    name: new Date(x.created_at).toString(),
                    value: x,
                };
            });
            const questions = [{
                    type: 'list',
                    name: 'pipeline',
                    message: `Which ${pipelineIDOrName} pipeline?`,
                    choices,
                }];
            // eslint-disable-next-line no-async-promise-executor
            pipeline = await new Promise(async function (resolve, reject) {
                const answers = await (0, inquirer_1.prompt)(questions);
                if (answers.pipeline) {
                    resolve(answers.pipeline);
                }
                else {
                    // eslint-disable-next-line prefer-promise-reject-errors
                    reject('Must pick a pipeline');
                }
            });
        }
    }
    return pipeline;
}
exports.default = disambiguate;
