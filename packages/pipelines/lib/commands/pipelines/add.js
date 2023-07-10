"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const inquirer_1 = require("inquirer");
const api_1 = require("../../api");
const disambiguate_1 = tslib_1.__importDefault(require("../../disambiguate"));
const infer_1 = tslib_1.__importDefault(require("../../infer"));
const stages_1 = require("../../stages");
const cli = core_1.CliUx.ux;
class PipelinesAdd extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(PipelinesAdd);
        const app = flags.app;
        let stage;
        const guesses = (0, infer_1.default)(app);
        const questions = [];
        const pipeline = await (0, disambiguate_1.default)(this.heroku, args.pipeline);
        if (flags.stage) {
            stage = flags.stage;
        }
        else {
            questions.push({
                type: 'list',
                name: 'stage',
                message: `Stage of ${app}`,
                choices: stages_1.inferrableStageNames,
                default: guesses[1],
            });
        }
        const answers = await (0, inquirer_1.prompt)(questions);
        if (answers.stage)
            stage = answers.stage;
        cli.action.start(`Adding ${color_1.default.app(app)} to ${color_1.default.pipeline(pipeline.name)} pipeline as ${stage}`);
        await (0, api_1.createCoupling)(this.heroku, pipeline, app, stage);
        cli.action.stop();
    }
}
exports.default = PipelinesAdd;
PipelinesAdd.description = `add this app to a pipeline
The app and pipeline names must be specified.
The stage of the app will be guessed based on its name if not specified.`;
PipelinesAdd.examples = [
    '$ heroku pipelines:add my-pipeline -a my-app -s production',
];
PipelinesAdd.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    stage: command_1.flags.string({
        char: 's',
        description: 'stage of first app in pipeline',
        completion: completions_1.StageCompletion,
    }),
};
PipelinesAdd.args = [{
        name: 'pipeline',
        description: 'name of pipeline',
        required: true,
    }];
