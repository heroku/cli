"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@heroku-cli/command");
const core_1 = require("@oclif/core");
class Logout extends command_1.Command {
    async run() {
        core_1.CliUx.ux.action.start('Logging out');
        await this.heroku.logout();
        await this.config.runHook('recache', { type: 'logout' });
    }
}
exports.default = Logout;
Logout.description = 'clears local login credentials and invalidates API session';
Logout.aliases = ['logout'];
