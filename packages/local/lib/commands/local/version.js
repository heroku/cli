"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const fork_foreman_1 = require("../../fork-foreman");
class Version extends core_1.Command {
    async run() {
        await this.parse(Version);
        const execArgv = ['--version'];
        await (0, fork_foreman_1.fork)(execArgv);
    }
}
exports.default = Version;
Version.description = 'display node-foreman version';
