"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const validate_1 = require("./validate");
const cli = core_1.CliUx.ux;
function filter(obj) {
    const ret = {};
    Object.keys(obj)
        .filter((key) => obj[key] !== undefined)
        .forEach((key) => {
        ret[key] = obj[key];
    });
    return ret;
}
async function getNameAndRepo(args) {
    const answer = {
        name: '',
        repo: '',
    };
    if (!args.name) {
        const name = await cli.prompt('Pipeline name', {
            required: true,
        });
        const [valid, msg] = (0, validate_1.pipelineName)(name);
        if (valid) {
            answer.name = name;
        }
        else {
            cli.error(msg);
        }
    }
    if (!args.repo) {
        const repo = await cli.prompt('GitHub repository to connect to (e.g. rails/rails)', {
            required: true,
        });
        const [valid, msg] = (0, validate_1.repoName)(repo);
        if (valid) {
            answer.repo = repo;
        }
        else {
            cli.error(msg);
        }
    }
    const reply = Object.assign(filter(answer), filter(args));
    reply.name = reply.name.toLowerCase().replace(/\s/g, '-');
    return reply;
}
exports.default = getNameAndRepo;
