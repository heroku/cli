var child = require('child_process');
var path = require('path');
var os = require('os');
var fs = require('fs');
var Heroku = require('heroku-client');
var request = require('request');
var agent = require('superagent');
var cli = require('heroku-cli-util');
var _ = require('lodash');
var ProgressBar = require('progress');

var directory = require('../lib/directory');
var docker = require('../lib/docker');
var safely = require('../lib/safely');

const ADDONS = require('../lib/addons');

module.exports = function(topic) {
  return {
    topic: topic,
    command: 'release',
    description: 'create and release slug to app',
    help: 'Create slug tarball from Docker image and release it to Heroku app',
    needsApp: true,
    needsAuth: true,
    run: safely(release)
  };
};

function release(context) {
  var procfile = directory.readProcfile(context.cwd);
  var mountDir = directory.determineMountDir(context.cwd);
  var modifiedProc = _.mapValues(procfile, prependMountDir(mountDir));
  var heroku = context.heroku || new Heroku({ token: context.auth.password });
  var app = context.heroku ? context.app : heroku.apps(context.app);
  var appJSONLocation = path.join(context.cwd, 'app.json');
  var appJSON = JSON.parse(fs.readFileSync(appJSONLocation, { encoding: 'utf8' }));

  request = context.request || request;

  if (!procfile) throw new Error('Procfile required. Aborting');

  return app.info()
    .then(readRemoteAddons)
    .then(compareLocalAddons)
    .then(addMissingAddons)
    .then(createLocalSlug)
    .then(createRemoteSlug)
    .then(uploadSlug)
    .then(releaseSlug)
    .then(showMessage);

  function prependMountDir(mountDir) {
    return function(cmd) {
      return `cd ${ mountDir } && ${ cmd }`
    }
  }

  function readRemoteAddons() {
    return app.addons().list();
  }

  function compareLocalAddons(remoteAddons) {
    var remoteNames = _.map(remoteAddons, getServiceName);
    var localNames = appJSON.addons || [];
    var missingAddons = _.filter(localNames, isMissingFrom.bind(this, remoteNames));

    console.log(`Remote addons: ${ remoteNames.join(', ')} (${ remoteNames.length })`);
    console.log(`Local addons: ${ localNames.join(', ') } (${ localNames.length })`);
    console.log(`Missing addons: ${ missingAddons.join(', ') } (${ missingAddons.length })`);

    return Promise.resolve(missingAddons);

    function getServiceName(addon) {
      return addon.addon_service.name;
    }

    function isMissingFrom(list, addon) {
      var name = addon.split(':')[0];
      return list.indexOf(name) === -1;
    }
  }

  function addMissingAddons(addons) {
    return Promise.all(addons.map(createAddon));

    function createAddon(name) {
      console.log(`Provisioning ${ name }...`)
      return app.addons().create({
        plan: name
      });
    }
  }

  function createLocalSlug() {
    cli.log('Creating local slug...');

    return new Promise(function(resolve, reject) {
      var slugPath = os.tmpdir();
      var output = '';
      var build = child.spawn('docker-compose', ['build', 'web']);

      build.stdout.pipe(process.stdout);
      build.stderr.pipe(process.stderr);
      build.stdout.on('data', saveOutput);
      build.on('exit', onBuildExit);

      function saveOutput(data) {
        output += data;
      }

      function onBuildExit(code) {
        if (code !== 0) {
          cli.log('Build failed. Make sure `docker-compose build web` returns a 0 exit status.');
          process.exit(1);
        }

        var tokens = output.match(/\S+/g);
        var fromMatch = output.match(/FROM ([^\s]+)/) || [];
        var imageName = fromMatch[1];
        var imageId = tokens[tokens.length - 1];
        tar(imageName, imageId);
      }

      function tar(imageName, imageId) {
        cli.log('extracting slug from container...');
        var containerId = child.execSync(`docker run -d ${imageId} tar cfvz /tmp/slug.tgz -C / --exclude=.git --exclude=.cache --exclude=.buildpack ./app`, {
          encoding: 'utf8'
        }).trim();
        child.execSync(`docker wait ${containerId}`);
        child.execSync(`docker cp ${containerId}:/tmp/slug.tgz ${slugPath}`);
        child.execSync(`docker rm -f ${containerId}`);
        resolve({
          path: path.join(slugPath, 'slug.tgz'),
          name: imageName
        });
      }
    });
  }

  function createRemoteSlug(slug) {
    var lang = `heroku-docker (${ slug.name || 'unknown'})`;
    cli.log(`creating remote slug...`);
    cli.log(`language-pack: ${ lang }`);
    cli.log('remote process types:', modifiedProc);
    var slugInfo = app.slugs().create({
      process_types: modifiedProc,
      buildpack_provided_description: lang
    });
    return Promise.all([slug.path, slugInfo])
  }

  function uploadSlug(slug) {
    var slugPath = slug[0];
    var slugInfo = slug[1];
    var size = fs.statSync(slugPath).size;
    var mbs = Math.round(size / 1024 / 1024)
    var bar = new ProgressBar(`uploading slug [:bar] :percent of ${ mbs } MB, :etas`, {
      width: 20,
      total: size
    });

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
        .on('data', updateProgress)
        .pipe(outStream)
        .on('error', reject)
        .on('response', resolve.bind(this, slugInfo.id));

      function updateProgress(chunk) {
        bar.tick(chunk.length);
      }
    });
  }

  function releaseSlug(id) {
    cli.log('releasing slug...');

    return heroku.request({
      method: 'POST',
      path: `${ app.path }/releases`,
      headers: {
        'Heroku-Deploy-Type': 'heroku-docker'
      },
      body: {
        slug: id
      }
    });
  }

  function showMessage(results) {
    console.log(`Successfully released ${ results.app.name }!`);
  }
}
