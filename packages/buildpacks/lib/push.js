"use strict";
module.exports = function (remote) {
    return `git push ${remote || 'heroku'} main`;
};
