"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const pipelines_1 = require("../../utils/pipelines");
const source_1 = require("../../utils/source");
const test_run_1 = require("../../utils/test-run");
const cli = core_1.CliUx.ux;
class CiReRun extends command_1.Command {
    async run() {
        const { flags, args } = await this.parse(CiReRun);
        const pipeline = await (0, pipelines_1.getPipeline)(flags, this);
        let sourceTestRun;
        if (args.number) {
            const testRunResponse = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs/${args.number}`);
            sourceTestRun = testRunResponse.body;
        }
        else {
            const { body: testRuns } = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs`, { headers: { Range: 'number ..; order=desc,max=1' } });
            sourceTestRun = testRuns[0];
        }
        this.log(`Rerunning test run #${sourceTestRun.number}...`);
        cli.action.start('Preparing source');
        const sourceBlobUrl = await (0, source_1.createSourceBlob)(sourceTestRun.commit_sha, this);
        cli.action.stop();
        const { body: pipelineRepository } = await this.heroku.get(`https://kolkrabbi.heroku.com/pipelines/${pipeline.id}/repository`);
        cli.action.start('Starting test run');
        const organization = pipelineRepository.organization && pipelineRepository.organization.name;
        const { body: testRun } = await this.heroku.post('/test-runs', { body: {
                commit_branch: sourceTestRun.commit_branch,
                commit_message: sourceTestRun.commit_message,
                commit_sha: sourceTestRun.commit_sha,
                pipeline: pipeline.id,
                organization,
                source_blob_url: sourceBlobUrl,
            },
        });
        cli.action.stop();
        await (0, test_run_1.displayAndExit)(pipeline, testRun.number, this);
    }
}
exports.default = CiReRun;
CiReRun.description = 'rerun tests against current directory';
CiReRun.examples = [
    `$ heroku ci:rerun 985 --app murmuring-headland-14719
`,
];
CiReRun.flags = {
    app: command_1.flags.string({ char: 'a', description: 'app name' }),
    pipeline: command_1.flags.pipeline({ required: false }),
};
CiReRun.args = [{ name: 'number', required: false }];
