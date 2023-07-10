"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildpackCommand = void 0;
const color_1 = require("@heroku-cli/color");
const buildpack_registry_1 = require("@heroku/buildpack-registry");
const core_1 = require("@oclif/core");
const lodash_1 = require("lodash");
const true_myth_1 = require("true-myth");
// eslint-disable-next-line node/no-missing-require
const push = require('./push');
const validUrl = require('valid-url');
class BuildpackCommand {
    constructor(heroku) {
        this.heroku = heroku;
        this.registry = new buildpack_registry_1.BuildpackRegistry();
    }
    async fetch(app) {
        const buildpacks = await this.heroku.get(`/apps/${app}/buildpack-installations`);
        return this.mapBuildpackResponse(buildpacks);
    }
    mapBuildpackResponse(buildpacks) {
        const body = buildpacks.body;
        return body.map((bp) => {
            bp.buildpack.url = bp.buildpack.url.replace(/^urn:buildpack:/, '');
            return bp;
        });
    }
    display(buildpacks, indent) {
        if (buildpacks.length === 1) {
            core_1.CliUx.ux.log(this.registryUrlToName(buildpacks[0].buildpack.url, true));
        }
        else {
            buildpacks.forEach((b, i) => {
                core_1.CliUx.ux.log(`${indent}${i + 1}. ${this.registryUrlToName(b.buildpack.url, true)}`);
            });
        }
    }
    async registryNameToUrl(buildpack) {
        if (validUrl.isWebUri(buildpack)) {
            return buildpack;
        }
        true_myth_1.Result.match({
            Ok: _ => { },
            Err: err => {
                core_1.CliUx.ux.error(`Could not find the buildpack: ${buildpack}. ${err}`, { exit: 1 });
            },
        }, buildpack_registry_1.BuildpackRegistry.isValidBuildpackSlug(buildpack));
        try {
            const response = await this.registry.buildpackExists(buildpack);
            const body = await response.json();
            return body.blob_url;
        }
        catch (error) {
            if (error.statusCode === 404) {
                core_1.CliUx.ux.error(`${buildpack} is not in the buildpack registry.`, { exit: 1 });
            }
            else if (error.statusCode) {
                core_1.CliUx.ux.error(`${error.statusCode}: ${error.message}`, { exit: 1 });
            }
            else {
                core_1.CliUx.ux.error(error.message, { exit: 1 });
            }
        }
        return '';
    }
    async findUrl(buildpacks, buildpack) {
        const mappedUrl = await this.registryNameToUrl(buildpack);
        return (0, lodash_1.findIndex)(buildpacks, (b) => {
            return b.buildpack.url === buildpack || b.buildpack.url === mappedUrl;
        });
    }
    async validateUrlNotSet(buildpacks, buildpack) {
        if (await this.findUrl(buildpacks, buildpack) !== -1) {
            core_1.CliUx.ux.error(`The buildpack ${buildpack} is already set on your app.`, { exit: 1 });
        }
    }
    findIndex(buildpacks, index) {
        if (index) {
            return (0, lodash_1.findIndex)(buildpacks, function (b) {
                return b.ordinal + 1 === index;
            });
        }
        return -1;
    }
    async mutate(app, buildpacks, spliceIndex, buildpack, command) {
        const buildpackUpdates = buildpacks.map(function (b) {
            return { buildpack: b.buildpack.url };
        });
        const howmany = (command === 'add') ? 0 : 1;
        const urls = (command === 'remove') ? [] : [{ buildpack: await this.registryNameToUrl(buildpack) }];
        const indexes = [spliceIndex, howmany];
        const array = indexes.concat(urls);
        Array.prototype.splice.apply(buildpackUpdates, array);
        return this.put(app, buildpackUpdates);
    }
    async put(app, buildpackUpdates) {
        const buildpacks = await this.heroku.put(`/apps/${app}/buildpack-installations`, {
            headers: { Range: '' },
            body: { updates: buildpackUpdates },
        });
        return this.mapBuildpackResponse(buildpacks);
    }
    displayUpdate(app, remote, buildpacks, action) {
        if (buildpacks.length === 1) {
            core_1.CliUx.ux.log(`Buildpack ${action}. Next release on ${app} will use ${this.registryUrlToName(buildpacks[0].buildpack.url)}.`);
            core_1.CliUx.ux.log(`Run ${color_1.default.magenta(push(remote))} to create a new release using this buildpack.`);
        }
        else {
            core_1.CliUx.ux.log(`Buildpack ${action}. Next release on ${app} will use:`);
            this.display(buildpacks, '  ');
            core_1.CliUx.ux.log(`Run ${color_1.default.magenta(push(remote))} to create a new release using these buildpacks.`);
        }
    }
    registryUrlToName(buildpack, registryOnly = false) {
        // eslint-disable-next-line no-useless-escape
        let match = /^https:\/\/buildpack\-registry\.s3\.amazonaws\.com\/buildpacks\/([\w\-]+\/[\w\-]+).tgz$/.exec(buildpack);
        if (match) {
            return match[1];
        }
        if (!registryOnly) {
            // eslint-disable-next-line no-useless-escape
            match = /^https:\/\/codon\-buildpacks\.s3\.amazonaws\.com\/buildpacks\/heroku\/([\w\-]+).tgz$/.exec(buildpack);
            if (match) {
                return `heroku/${match[1]}`;
            }
        }
        return buildpack;
    }
    async clear(app, command, action) {
        await this.put(app, []);
        const configVars = await this.heroku.get(`/apps/${app}/config-vars`);
        const message = `Buildpack${command === 'clear' ? 's' : ''} ${action}.`;
        if (configVars.body.BUILDPACK_URL) {
            core_1.CliUx.ux.log(message);
            core_1.CliUx.ux.warn('The BUILDPACK_URL config var is still set and will be used for the next release');
        }
        else if (configVars.body.LANGUAGE_PACK_URL) {
            core_1.CliUx.ux.log(message);
            core_1.CliUx.ux.warn('The LANGUAGE_PACK_URL config var is still set and will be used for the next release');
        }
        else {
            core_1.CliUx.ux.log(`${message} Next release on ${app} will detect buildpacks normally.`);
        }
    }
    validateIndexInRange(buildpacks, index) {
        if (index < 0 || index > buildpacks.length) {
            if (buildpacks.length === 1) {
                core_1.CliUx.ux.error('Invalid index. Only valid value is 1.', { exit: 1 });
            }
            else {
                core_1.CliUx.ux.error(`Invalid index. Please choose a value between 1 and ${buildpacks.length}`, { exit: 1 });
            }
        }
    }
    validateIndex(index) {
        if (Number.isNaN(index) || index <= 0) {
            core_1.CliUx.ux.error('Invalid index. Must be greater than 0.', { exit: 1 });
        }
    }
}
exports.BuildpackCommand = BuildpackCommand;
