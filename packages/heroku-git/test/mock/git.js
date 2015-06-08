'use strict';

module.exports = {
  remoteFromGitConfig: function () {return Promise.resolve('heroku');},
  httpGitUrl:          function (app)  {return `https://git.heroku.com/${app}.git`;},
  spawn:               function ()     {return Promise.resolve();},
  exec:                function (args) {
    switch (args.join(' ')) {
      case 'remote':
        return Promise.resolve('heroku');
      default:
        return Promise.resolve();
    }
  }
};
