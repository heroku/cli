"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCommit = exports.githubRepository = exports.createArchive = void 0;
const fs = require("fs-extra");
const gh = require('github-url-to-object');
const spawn = require('child_process').spawn;
const tmp = require('tmp');
const NOT_A_GIT_REPOSITORY = 'not a git repository';
const RUN_IN_A_GIT_REPOSITORY = 'Please run this command from the directory containing your project\'s git repo';
const NOT_ON_A_BRANCH = 'not a symbolic ref';
const CHECKOUT_A_BRANCH = 'Please checkout a branch before running this command';
function runGit(...args) {
    const git = spawn('git', args);
    return new Promise((resolve, reject) => {
        git.on('exit', (exitCode) => {
            if (exitCode === 0) {
                return;
            }
            const error = (git.stderr.read() || 'unknown error').toString().trim();
            if (error.toLowerCase().includes(NOT_A_GIT_REPOSITORY)) {
                reject(RUN_IN_A_GIT_REPOSITORY);
                return;
            }
            if (error.includes(NOT_ON_A_BRANCH)) {
                reject(CHECKOUT_A_BRANCH);
                return;
            }
            reject(new Error(`Error while running 'git ${args.join(' ')}' (${error})`));
        });
        git.stdout.on('data', (data) => resolve(data.toString().trim()));
    });
}
async function getRef(branch) {
    return runGit('rev-parse', branch || 'HEAD');
}
async function getBranch(symbolicRef) {
    return runGit('symbolic-ref', '--short', symbolicRef);
}
async function getCommitTitle(ref) {
    return runGit('log', ref || '', '-1', '--pretty=format:%s');
}
async function createArchive(ref) {
    const tar = spawn('git', ['archive', '--format', 'tar.gz', ref]);
    const file = tmp.fileSync({ postfix: '.tar.gz' });
    const write = tar.stdout.pipe(fs.createWriteStream(file.name));
    return new Promise((resolve, reject) => {
        write.on('close', () => resolve(file.name));
        write.on('error', reject);
    });
}
exports.createArchive = createArchive;
async function githubRepository() {
    const remote = await runGit('remote', 'get-url', 'origin');
    const repository = gh(remote);
    if (repository === null) {
        throw new Error('Not a GitHub repository');
    }
    return repository;
}
exports.githubRepository = githubRepository;
async function readCommit(commit) {
    const branch = await getBranch('HEAD');
    const ref = await getRef(commit);
    const message = await getCommitTitle(ref);
    return Promise.resolve({
        branch,
        ref,
        message,
    });
}
exports.readCommit = readCommit;
