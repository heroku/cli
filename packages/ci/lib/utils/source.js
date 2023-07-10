"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSourceBlob = void 0;
const fs = require("async-file");
const core_1 = require("@oclif/core");
const git = require("./git");
const ux = core_1.CliUx.ux;
const got = require('got');
async function uploadArchive(url, filePath) {
    const request = got.stream.put(url, {
        headers: {
            'content-length': (await fs.stat(filePath)).size,
        },
    });
    fs.createReadStream(filePath).pipe(request);
    return new Promise((resolve, reject) => {
        request.on('error', reject);
        request.on('response', resolve);
    });
}
async function prepareSource(ref, command) {
    const filePath = await git.createArchive(ref);
    const { body: source } = await command.heroku.post('/sources');
    await uploadArchive(source.source_blob.put_url, filePath);
    return Promise.resolve(source);
}
async function createSourceBlob(ref, command) {
    try {
        const githubRepository = await git.githubRepository();
        const { user, repo } = githubRepository;
        const { body: archiveLink } = await command.heroku.get(`https://kolkrabbi.heroku.com/github/repos/${user}/${repo}/tarball/${ref}`);
        if (await command.heroku.request(archiveLink.archive_link, { method: 'HEAD' })) {
            return archiveLink.archive_link;
        }
    }
    catch (error) {
        // the commit isn't in the repo, we will package the local git commit instead
        ux.debug(`Commit not found in pipeline repository: ${error}`);
    }
    const sourceBlob = await prepareSource(ref, command);
    return sourceBlob.source_blob.get_url;
}
exports.createSourceBlob = createSourceBlob;
