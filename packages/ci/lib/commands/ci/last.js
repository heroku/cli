"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
const pipelines_1 = require("../../utils/pipelines");
const test_run_1 = require("../../utils/test-run");
const cli = core_1.CliUx.ux;
class CiLast extends command_1.Command {
    async run() {
        const { flags } = await this.parse(CiLast);
        const pipeline = await (0, pipelines_1.getPipeline)(flags, this);
        const headers = { Range: 'number ..; order=desc,max=1' };
        const { body: latestTestRuns } = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs`, { headers });
        if (latestTestRuns.length === 0) {
            return cli.warn('No Heroku CI runs found for the specified app and/or pipeline.');
        }
        const { body: testRun } = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs/${latestTestRuns[0].number}`);
        const { body: testNodes } = await this.heroku.get(`/test-runs/${testRun.id}/test-nodes`);
        await (0, test_run_1.displayTestRunInfo)(this, testRun, testNodes, flags.node);
    }
}
exports.default = CiLast;
CiLast.description = 'looks for the most recent run and returns the output of that run';
CiLast.examples = [
    `$ heroku ci:last --pipeline=my-pipeline --node 100
`,
];
CiLast.flags = {
    app: command_1.flags.string({ char: 'a', description: 'app name' }),
    node: command_1.flags.string({ description: 'the node number to show its setup and output', required: false }),
    pipeline: command_1.flags.pipeline({ required: false }),
};
