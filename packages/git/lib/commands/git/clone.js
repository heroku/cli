"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitClone = void 0;
const tslib_1 = require("tslib");
const command_1 = require("@heroku-cli/command");
const git_1 = tslib_1.__importDefault(require("../../git"));
class GitClone extends command_1.Command {
    async run() {
        const git = new git_1.default();
        const { flags, args } = await this.parse(GitClone);
        const { body: app } = await this.heroku.get(`/apps/${flags.app}`);
        const directory = args.DIRECTORY || app.name;
        const remote = flags.remote || 'heroku';
        await git.spawn(['clone', '-o', remote, git.url(app.name), directory]);
    }
}
exports.GitClone = GitClone;
GitClone.description = 'clones a heroku app to your local machine at DIRECTORY (defaults to app name)';
GitClone.example = `$ heroku git:clone -a example
Cloning into 'example'...
remote: Counting objects: 42, done.
...`;
GitClone.args = [
    { name: 'DIRECTORY', optional: true, description: 'where to clone the app' },
];
GitClone.flags = {
    app: command_1.flags.string({ char: 'a', env: 'HEROKU_APP', required: true, description: 'the Heroku app to use' }),
    remote: command_1.flags.string({ char: 'r', description: 'the git remote to create, default "heroku"' }),
};
