"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const pipelines_1 = require("../../utils/pipelines");
const test_run_1 = require("../../utils/test-run");
class CiInfo extends command_1.Command {
    async run() {
        const { args, flags } = await this.parse(CiInfo);
        const pipeline = await (0, pipelines_1.getPipeline)(flags, this);
        const { body: testRun } = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs/${args['test-run']}`);
        const { body: testNodes } = await this.heroku.get(`/test-runs/${testRun.id}/test-nodes`);
        await (0, test_run_1.displayTestRunInfo)(this, testRun, testNodes, flags.node);
    }
}
exports.default = CiInfo;
CiInfo.description = 'show the status of a specific test run';
CiInfo.examples = [
    `$ heroku ci:info 1288 --app murmuring-headland-14719
`,
];
CiInfo.flags = {
    app: command_1.flags.string({ char: 'a', description: 'app name' }),
    node: command_1.flags.string({ description: 'the node number to show its setup and output', required: false }),
    pipeline: command_1.flags.pipeline({ required: false }),
};
CiInfo.args = [{ name: 'test-run', required: true }];
