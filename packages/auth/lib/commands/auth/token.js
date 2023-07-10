"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
const formatRelative_1 = tslib_1.__importDefault(require("date-fns/formatRelative"));
class AuthToken extends command_1.Command {
    async run() {
        this.parse(AuthToken);
        if (!this.heroku.auth)
            this.error('not logged in');
        try {
            const { body: tokens } = await this.heroku.get('/oauth/authorizations', { retryAuth: false });
            const token = tokens.find((t) => t.access_token && t.access_token.token === this.heroku.auth);
            if (token && token.access_token.expires_in) {
                const d = new Date();
                d.setSeconds(d.getSeconds() + token.access_token.expires_in);
                this.warn(`token will expire ${(0, formatRelative_1.default)(d, new Date())}\nUse ${color_1.default.cmd('heroku authorizations:create')} to generate a long-term token`);
            }
        }
        catch (error) {
            this.warn(error);
        }
        this.log(this.heroku.auth);
    }
}
exports.default = AuthToken;
AuthToken.description = `outputs current CLI authentication token.
By default, the CLI auth token is only valid for 1 year. To generate a long-lived token, use heroku authorizations:create`;
AuthToken.flags = {
    help: command_1.flags.help({ char: 'h' }),
};
