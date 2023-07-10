"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const cli = core_1.CliUx.ux;
async function getCISettings(yes, organization) {
    const settings = {
        ci: true,
        organization: undefined,
    };
    if (yes) {
        delete settings.organization;
        return settings;
    }
    settings.ci = await cli.confirm('Enable automatic Heroku CI test runs?');
    if (settings.ci && organization) {
        settings.organization = organization;
    }
    return settings;
}
exports.default = getCISettings;
