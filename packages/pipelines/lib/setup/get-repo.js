"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getRepo(github, name) {
    return github.getRepo(name).catch(() => {
        throw new Error(`Could not access the ${name} repo`);
    });
}
exports.default = getRepo;
