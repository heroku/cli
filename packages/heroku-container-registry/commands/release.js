var child = require('child_process');
var path = require('path');
var os = require('os');
var fs = require('fs');
var Heroku = require('heroku-client');
var request = require('request');
var state = require('../lib/state');
var docker = require('../lib/docker');
var agent = require('superagent');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'release',
    description: 'creates a slug tarball from the built image and releases it to your Heroku app',
    help: `help text for ${topic}:release`,
    needsApp: true,
    needsAuth: true,
    run: release
  };
};

function release(context) {
  var heroku = new Heroku({ token: context.auth.password });
  var app = heroku.apps(context.app);

  docker.startB2D();

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
      var imageId = state.get(context.cwd).startImageId;
      var containerId = child.execSync(`docker run -d ${imageId} tar cfz /tmp/slug.tgz --exclude='.*' /app`, {
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
    var slugInfo = app.slugs().create({
      process_types: {
        web: 'npm start'
      }
    });
    return Promise.all([slugPath, slugInfo])
  }

  function uploadSlug(slug) {
    console.log('uploading slug...');
    var slugPath = slug[0];
    var slugInfo = slug[1];

    console.log('slugPath:', slugPath);
    console.log('slugUrl:', slugInfo.blob.url);

    return new Promise(function(resolve, reject) {
      var contentType = 'binary/octet-stream';
      console.log('content-type:', contentType);
      var outStream = request({
        method: 'PUT',
        url: slugInfo.blob.url,
        headers: {
          'content-type': contentType
        }
      });

      fs.createReadStream(slugPath)
        .on('error', reject)
        .pipe(outStream)
        .on('response', function(res) {
          console.log('response from s3:', res.statusCode, res.statusMessage);
        })
        .on('close', function() {
          console.log('s3 closed');
        })
        .on('error', reject)
        .on('finish', resolve.bind(this, slugInfo.id));
    });
  }

  function releaseSlug(id, response) {
    console.log('releasing slug...');
    process.exit();
    return app.releases().create({
      slug: id
    });
  }

  function onErr(err) {
    console.log('caught err:', err.stack);
    console.log('body:', err.body);
  }
}
