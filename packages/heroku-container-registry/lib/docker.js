var path = require('path');
var child = require('child_process');
var fs = require('fs');
var _ = require('lodash');
var uuid = require('node-uuid');

module.exports = {
  buildEphemeralImage: buildEphemeralImage,
  writeDockerfile: writeDockerfile,
  buildImage: buildImage
};

function buildEphemeralImage(dir, contents) {
  return new Promise(function(resolve, reject) {
    var filename = `Dockerfile-${uuid.v1()}`;
    var dockerfile = path.join(dir, filename);
    fs.writeFileSync(dockerfile, contents, { encoding: 'utf8' });
    buildImage(dir, dockerfile)
      .then(function(imageId) {
        fs.unlinkSync(dockerfile);
        resolve(imageId);
      });
  });
}

function writeDockerfile(filePath, templatePath, values) {
  console.log('creating Dockerfile...');
  var template = fs.readFileSync(templatePath, { encoding: 'utf8' });
  var compiled = _.template(template);
  var dockerfile = compiled(values || {});
  fs.writeFileSync(filePath, dockerfile, { encoding: 'utf8' });
}

function buildImage(dir, dockerfile) {
  console.log('building image...');

  return new Promise(function(resolve, reject) {
    var args = `build --force-rm --file="${dockerfile}" ${dir}`.split(' ');
    var build = child.spawn('docker', args);
    var stdout = '';

    build.stdout.on('data', function(chunk) {
      stdout += chunk;
    });

    build.stdout.on('end', function() {
      var tokens = stdout.trim().split(' ');
      var id = tokens[tokens.length - 1];
      resolve(id);
    });

    build.stdout.pipe(process.stdout);
    build.stderr.pipe(process.stderr);
  });
}
