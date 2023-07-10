"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getGitHubToken(kolkrabbi) {
    return kolkrabbi.getAccount().then((account) => {
        return account.github.token;
    }, () => {
        throw new Error('Account not connected to GitHub.');
    });
}
exports.default = getGitHubToken;
