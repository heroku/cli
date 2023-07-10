"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
class AuthWhoami extends command_1.Command {
    async run() {
        if (process.env.HEROKU_API_KEY)
            this.warn('HEROKU_API_KEY is set');
        if (!this.heroku.auth)
            this.notloggedin();
        try {
            const { body: account } = await this.heroku.get('/account', { retryAuth: false });
            this.log(account.email);
        }
        catch (error) {
            if (error.statusCode === 401)
                this.notloggedin();
            throw error;
        }
    }
    notloggedin() {
        this.error('not logged in', { exit: 100 });
    }
}
exports.default = AuthWhoami;
AuthWhoami.description = 'display the current logged in user';
AuthWhoami.aliases = ['whoami'];
