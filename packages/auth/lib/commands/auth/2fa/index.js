"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
class TwoFactor extends command_1.Command {
    async run() {
        const { body: account } = await this.heroku.get('/account');
        if (account.two_factor_authentication) {
            this.log(`Two-factor authentication is ${color_1.default.bold('enabled')}`);
        }
        else {
            this.log(`Two-factor authentication is ${color_1.default.bold('not enabled')}`);
        }
    }
}
exports.default = TwoFactor;
TwoFactor.description = 'check 2fa status';
TwoFactor.aliases = ['2fa', 'twofactor'];
