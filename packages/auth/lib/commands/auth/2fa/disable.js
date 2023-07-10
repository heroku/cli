"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
class Auth2faGenerate extends command_1.Command {
    async run() {
        core_1.CliUx.ux.error('this command has been removed, in favor of disabling MFA in your Account Settings in a browser: https://dashboard.heroku.com/account');
    }
}
exports.default = Auth2faGenerate;
Auth2faGenerate.description = 'disables 2fa on account';
Auth2faGenerate.example = '$ heroku auth:2fa:disable';
Auth2faGenerate.aliases = [
    'twofactor:disable',
    '2fa:disable',
];
