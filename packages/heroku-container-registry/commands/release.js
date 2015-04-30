var child = require('child_process');
var path = require('path');
var os = require('os');
var fs = require('fs');
var Heroku = require('heroku-client');
var request = require('request');
var agent = require('superagent');
var cli = require('heroku-cli-util');
var directory = require('../lib/directory');
var docker = require('../lib/docker');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'release',
    description: 'create and release slug to app',
    help: 'Create slug tarball from Docker image and release it to Heroku app',
    needsApp: true,
    needsAuth: true,
    run: release
  };
};

function release(context) {
  var procfile = directory.readProcfile(context.cwd);

  var heroku = context.heroku || new Heroku({ token: context.auth.password });
  var app = context.heroku ? context.app : heroku.apps(context.app);
  request = context.request || request;

  if (!procfile) {
    cli.error('Procfile required. Aborting');
    return;
  }

  return app.info()
    .then(createLocalSlug)
    .then(createRemoteSlug)
    .then(uploadSlug)
    .then(releaseSlug);

  function createLocalSlug() {
    cli.log('creating local slug...');
    try {
      var slugPath = os.tmpdir();
      var imageId = docker.ensureStartImage(context.cwd);
      if (!imageId) {
	      return Promise.reject();
      }

      var containerId = child.execSync(`docker run -d ${imageId} tar cfvz /tmp/slug.tgz -C / --exclude=.git --exclude=.heroku ./app`, {
        encoding: 'utf8'
      }).trim();
      child.execSync(`docker wait ${containerId}`);
      child.execSync(`docker cp ${containerId}:/tmp/slug.tgz ${slugPath}`);
      child.execSync(`docker rm -f ${containerId}`);
      return Promise.resolve(path.join(slugPath, 'slug.tgz'));
    }
    catch (e) {
      return Promise.reject(e);
    }
  }

  function createRemoteSlug(slugPath) {
    cli.log('creating remote slug...');
    var slugInfo = app.slugs().create({
      process_types: procfile
    });
    return Promise.all([slugPath, slugInfo])
  }

  function uploadSlug(slug) {
    cli.log('uploading slug...');
    var slugPath = slug[0];
    var slugInfo = slug[1];
    var size = fs.statSync(slugPath).size;

    return new Promise(function(resolve, reject) {
      var outStream = request({
        method: 'PUT',
        url: slugInfo.blob.url,
        headers: {
          'content-type': '',
          'content-length': size
        }
      });

      fs.createReadStream(slugPath)
        .on('error', reject)
        .pipe(outStream)
        .on('error', reject)
        .on('response', resolve.bind(this, slugInfo.id));
    });
  }

  function releaseSlug(id) {
    cli.log('releasing slug...');
    return app.releases().create({
      slug: id
    });
  }
}
