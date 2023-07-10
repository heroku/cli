"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const color_1 = tslib_1.__importDefault(require("@heroku-cli/color"));
const command_1 = require("@heroku-cli/command");
class Login extends command_1.Command {
    async run() {
        const { flags } = await this.parse(Login);
        let method;
        if (flags.interactive)
            method = 'interactive';
        await this.heroku.login({ method, expiresIn: flags['expires-in'], browser: flags.browser });
        const { body: account } = await this.heroku.get('/account', { retryAuth: false });
        this.log(`Logged in as ${color_1.default.green(account.email)}`);
        await this.config.runHook('recache', { type: 'login' });
    }
}
exports.default = Login;
Login.description = 'login with your Heroku credentials';
Login.aliases = ['login'];
Login.flags = {
    browser: command_1.flags.string({ description: 'browser to open SSO with (example: "firefox", "safari")' }),
    sso: command_1.flags.boolean({ hidden: true, char: 's', description: 'login for enterprise users under SSO' }),
    interactive: command_1.flags.boolean({ char: 'i', description: 'login with username/password' }),
    'expires-in': command_1.flags.integer({ char: 'e', description: 'duration of token in seconds (default 30 days)' }),
};
