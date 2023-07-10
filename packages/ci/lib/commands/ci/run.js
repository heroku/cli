"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const git = require("../../utils/git");
const pipelines_1 = require("../../utils/pipelines");
const source_1 = require("../../utils/source");
const test_run_1 = require("../../utils/test-run");
const cli = core_1.CliUx.ux;
class CiRun extends command_1.Command {
    async run() {
        const { flags } = await this.parse(CiRun);
        const pipeline = await (0, pipelines_1.getPipeline)(flags, this);
        const commit = await git.readCommit('HEAD');
        cli.action.start('Preparing source');
        const sourceBlobUrl = await (0, source_1.createSourceBlob)(commit.ref, this);
        cli.action.stop();
        cli.action.start('Starting test run');
        const { body: pipelineRepository } = await this.heroku.get(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`);
        const organization = pipelineRepository.organization && pipelineRepository.organization.name;
        const { body: testRun } = await this.heroku.post('/test-runs', { body: {
                commit_branch: commit.branch,
                commit_message: commit.message,
                commit_sha: commit.ref,
                pipeline: pipeline.id,
                organization,
                source_blob_url: sourceBlobUrl,
            },
        });
        cli.action.stop();
        await (0, test_run_1.displayAndExit)(pipeline, testRun.number, this);
    }
}
exports.default = CiRun;
CiRun.description = 'run tests against current directory';
CiRun.examples = [
    `$ heroku ci:run --app murmuring-headland-14719
`,
];
CiRun.flags = {
    app: command_1.flags.string({ char: 'a', description: 'app name' }),
    pipeline: command_1.flags.pipeline({ required: false }),
};
