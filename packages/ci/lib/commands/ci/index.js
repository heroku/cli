"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const pipelines_1 = require("../../utils/pipelines");
const test_run_1 = require("../../utils/test-run");
class CiIndex extends command_1.Command {
    async run() {
        const { flags } = await this.parse(CiIndex);
        const pipeline = await (0, pipelines_1.getPipeline)(flags, this);
        const { body: testRuns } = await this.heroku.get(`/pipelines/${pipeline.id}/test-runs`);
        await (0, test_run_1.renderList)(this, testRuns, pipeline, flags.watch, flags.json);
    }
}
exports.default = CiIndex;
CiIndex.description = 'display the most recent CI runs for the given pipeline';
CiIndex.examples = [
    `$ heroku ci --app murmuring-headland-14719
`,
];
CiIndex.flags = {
    app: command_1.flags.string({ char: 'a', description: 'app name' }),
    watch: command_1.flags.boolean({ description: 'keep running and watch for new and update tests', required: false }),
    pipeline: command_1.flags.pipeline({ required: false }),
    json: command_1.flags.boolean({ description: 'output in json format', required: false }),
};
