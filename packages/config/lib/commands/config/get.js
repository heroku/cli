"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigGet = void 0;
const command_1 = require("@heroku-cli/command");
const quote_1 = require("../../quote");
class ConfigGet extends command_1.Command {
    async run() {
        const { flags, argv } = await this.parse(ConfigGet);
        const { body: config } = await this.heroku.get(`/apps/${flags.app}/config-vars`);
        for (const key of argv) {
            const v = config[key];
            if (flags.shell) {
                this.log(`${key}=${(0, quote_1.quote)(v || '')}`);
            }
            else {
                this.log(v || '');
            }
        }
    }
}
exports.ConfigGet = ConfigGet;
ConfigGet.usage = 'config:get KEY...';
ConfigGet.description = 'display a single config value for an app';
ConfigGet.example = `$ heroku config:get RAILS_ENV
production`;
ConfigGet.strict = false;
ConfigGet.args = [{ name: 'KEY', required: true }];
ConfigGet.flags = {
    app: command_1.flags.app({ required: true }),
    remote: command_1.flags.remote(),
    shell: command_1.flags.boolean({ char: 's', description: 'output config vars in shell format' }),
};
