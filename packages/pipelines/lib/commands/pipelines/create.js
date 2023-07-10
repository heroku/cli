"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const completions_1 = require("@heroku-cli/command/lib/completions");
const core_1 = require("@oclif/core");
const inquirer_1 = require("inquirer");
const api_1 = require("../../api");
const infer_1 = tslib_1.__importDefault(require("../../infer"));
const stages_1 = require("../../stages");
const cli = core_1.CliUx.ux;
class Create extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(Create);
        let name;
        let stage;
        let owner;
        const guesses = (0, infer_1.default)(flags.app);
        const questions = [];
        const app = flags.app;
        if (args.name) {
            name = args.name;
        }
        else {
            questions.push({
                type: 'input',
                name: 'name',
                message: 'Pipeline name',
                default: guesses[0],
            });
        }
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
        const teamName = flags.team;
        const ownerType = teamName ? 'team' : 'user';
        // If team or org is not specified, we assign ownership to the user creating
        owner = teamName ? await (0, api_1.getTeam)(this.heroku, teamName) : await (0, api_1.getAccountInfo)(this.heroku);
        owner = owner.body;
        const ownerID = owner.id;
        owner = { id: ownerID, type: ownerType };
        const answers = await (0, inquirer_1.prompt)(questions);
        if (answers.name)
            name = answers.name;
        if (answers.stage)
            stage = answers.stage;
        cli.action.start(`Creating ${name} pipeline`);
        const { body: pipeline } = await (0, api_1.createPipeline)(this.heroku, name, owner);
        cli.action.stop();
        cli.action.start(`Adding ${color_1.default.app(app)} to ${color_1.default.pipeline(pipeline.name)} pipeline as ${stage}`);
        await (0, api_1.createCoupling)(this.heroku, pipeline, app, stage);
        cli.action.stop();
    }
}
exports.default = Create;
Create.description = `create a new pipeline
  An existing app must be specified as the first app in the pipeline.
  The pipeline name will be inferred from the app name if not specified.
  The stage of the app will be guessed based on its name if not specified.
  The pipeline owner will be the user creating the pipeline if not specified with -t for teams or -o for orgs.`;
Create.examples = [
    '$ heroku pipelines:create -a my-app-staging',
    '$ heroku pipelines:create my-pipeline -a my-app-staging',
];
Create.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    stage: command_1.flags.string({
        name: 'stage',
        char: 's',
        description: 'stage of first app in pipeline',
        completion: completions_1.StageCompletion,
    }),
    team: command_1.flags.team({
        description: 'the team which will own the apps',
    }),
};
Create.args = [{
        name: 'name',
        description: 'name of pipeline (defaults to basename of the app)',
        required: false,
    }];
