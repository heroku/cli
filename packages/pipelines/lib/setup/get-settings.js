"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const cli = core_1.CliUx.ux;
const DEFAULT_SETTINGS = {
    auto_deploy: true,
    wait_for_ci: true,
    pull_requests: {
        enabled: true,
        auto_deploy: true,
        auto_destroy: true,
    },
};
async function getSettings(yes, branch) {
    if (yes) {
        return DEFAULT_SETTINGS;
    }
    const settings = {
        auto_deploy: true,
        wait_for_ci: true,
        pull_requests: {
            enabled: true,
            auto_deploy: true,
            auto_destroy: true,
        },
    };
    settings.auto_deploy = await cli.confirm(`Automatically deploy the ${branch} branch to staging?`);
    if (settings.auto_deploy) {
        settings.wait_for_ci = await cli.confirm(`Wait for CI to pass before deploying the ${branch} branch to staging?`);
    }
    settings.pull_requests.enabled = await cli.confirm('Enable review apps?');
    if (settings.pull_requests.enabled) {
        settings.pull_requests.auto_deploy = await cli.confirm('Automatically create review apps for every PR?');
    }
    if (settings.pull_requests.enabled) {
        settings.pull_requests.auto_destroy = await cli.confirm('Automatically destroy idle review apps after 5 days?');
    }
    return settings;
}
exports.default = getSettings;
