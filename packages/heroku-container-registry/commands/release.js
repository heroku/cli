var child = require('child_process');
var path = require('path');
var os = require('os');
var fs = require('fs');
var Heroku = require('heroku-client');
var request = require('request');
var state = require('../lib/state');
var docker = require('../lib/docker');
var agent = require('superagent');
var util = require('heroku-cli-util');
var yaml = require('yamljs');

process.on('uncaughtException', function(err) {
  console.log('err:', err.stack);
});

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
  var heroku = new Heroku({ token: context.auth.password });
  var app = heroku.apps(context.app);

  var procfilePath = path.join(context.cwd, 'Procfile');
  try {
    fs.statSync(procfilePath);
  }
  catch (e) {
    util.error('Procfile required. Aborting');
    return;
  }

  app.info()
    .then(createLocalSlug)
    .then(createRemoteSlug)
    .then(uploadSlug)
    .then(releaseSlug)
    .catch(onErr);

  function createLocalSlug() {
    console.log('creating local slug...');
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
    console.log('creating remote slug...');
    var procfileEntries = yaml.load(procfilePath);
    var slugInfo = app.slugs().create({
      process_types: procfileEntries
    });
    return Promise.all([slugPath, slugInfo])
  }

  function uploadSlug(slug) {
    console.log('uploading slug...');
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
    console.log('releasing slug...');
    return app.releases().create({
      slug: id
    });
  }

  function onErr(err) {
    console.log('caught err:', err.stack);
    console.log('body:', err.body);
  }
}
