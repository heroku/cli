import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {listPipelineApps} from '../../lib/api'
import disambiguate from '../../lib/pipelines/disambiguate'
import renderPipeline from '../../lib/pipelines/render-pipeline'

export default class PipelinesOnboard extends Command {
  static description = 'onboard to GitOps'
  static defaultUrl = '.git/config:origin/.heroku/$pipelineName.pipeline.yaml'
  // cspell:ignore gitops
  static featureFlagName = 'gitops-alpha-1'

  static examples = [
    '$ heroku pipelines:onboard my-pipeline -url https://github.com/chap/flow-demo/blob/main/.heroku/pipeline.yaml',
  ]

  static flags = {
    url: flags.string({
      description: 'file to create (defaults to .git/config:origin/.heroku/$pipelineName.pipeline.yaml)',
      required: true,
      default: '.git/config:origin/.heroku/$pipelineName.pipeline.yaml',
    }),
    // remote: flags.remote(),
    // stage: flags.string({

    // json: flags.boolean({
    //   description: 'output in json format',
    // }),
    // yaml: flags.boolean({
    //   description: 'output in yaml format',
    // }),
    // 'with-owners': flags.boolean({
    //   description: 'shows owner of every app',
    //   hidden: true,
    // }),
  }

  static args = {
    pipeline: Args.string({
      description: 'pipeline to show list of apps for',
      required: true,
    }),
    // url: Args.string({
    //   description: 'file to create (defaults to .git/config:origin/.heroku/$pipelineName.pipeline.yaml)',
    //   required: true,
    //   default: PipelinesOnboard.defaultUrl,
    // }),
  }

  async run() {
    ux.action.start('Onboarding pipeline')

    const {args, flags} = await this.parse(PipelinesOnboard)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)
    // const pipelineApps = await listPipelineApps(this.heroku, pipeline.id!)

    // if (flags.json) {
    //   ux.styledJSON({pipeline, apps: pipelineApps})
    // } else if (flags.yaml) {
    //   // ux.styledJSON({pipeline, apps: pipelineApps})
    //   toYAML(pipeline.id!)
    // } else {
    // await renderPipeline(this.heroku, pipeline, pipelineApps, {
    //   withOwners: flags['with-owners'],
    //   showOwnerWarning: true,
    // })
    // }

    if (flags.url === PipelinesOnboard.defaultUrl) {
      const currentDir = process.cwd();
      const gitConfigPath = findGitConfig(currentDir);

      if (gitConfigPath) {
        const originUrl = extractOriginUrl(gitConfigPath);
        if (originUrl) {
          const filePath = `.heroku/${pipeline.name}.pipeline.yaml`;  // This could be any file path you want to generate the URL for
          flags.url = generateGitHubUrl(originUrl, filePath);
          // console.log(`creating file... ${flags.url}`);
        } else {
          console.error('No "origin" remote found in .git/config.');
        }
      } else {
        console.error("No .git/config file found in the current or parent directories.");
      }
    }

    openPullRequest(pipeline!, flags.url)
  }
}

const HEROKU_API_KEY = process.env.HEROKU_API_KEY || ''
const https = require('https')

interface HerokuPipelineCoupling {
  app: {
    id: string;
  };
  created_at: string;
  id: string;
  pipeline: {
    id: string;
  };
  stage: string;
  updated_at: string;
}

interface HerokuPipeline {
  id: string;
  name: string;
}

interface HerokuApp {
  id: string;
  name: string;
}

interface HerokuFormation {
  type: string;
  quantity: number;
  size: string;
  command: string;
}

async function fetchPipelineCouplings(pipelineId: string): Promise<HerokuPipelineCoupling[]> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/pipelines/${pipelineId}/pipeline-couplings`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch pipeline couplings: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function fetchPipelineName(pipelineId: string): Promise<HerokuPipeline> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/pipelines/${pipelineId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch pipeline name: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function fetchAppName(appId: string): Promise<HerokuApp> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/apps/${appId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch app name: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function fetchFormation(appId: string): Promise<HerokuFormation[]> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/apps/${appId}/formation`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch app formation: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function fetchAppInfo(appIds: string[]): Promise<{ id: string, name: string, formation: HerokuFormation[], domains: string[] }[]> {
  const promises = appIds.map(async appId => {
    const app = await fetchAppName(appId);
    const formation = await fetchFormation(appId);
    const domains = await fetchDomains(appId);
    return { ...app, formation, domains };
  });
  return Promise.all(promises);
}

function orderStages(stages: { name: string; apps: { name: string; id: string; formation: HerokuFormation[] }[] }[]): { name: string; apps: { name: string; id: string; formation: HerokuFormation[] }[] }[] {
  const order = ['development', 'staging', 'production'];

  return stages.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    return indexA - indexB;
  });
}

async function convertToHerokuPipelineCRD(couplings: HerokuPipelineCoupling[], appData: { id: string, name: string, formation: HerokuFormation[], domains: string[] }[], pipelineName: string, pipelineId: string) {
  const stages = couplings.reduce((acc, coupling) => {
    const stage = acc.find(s => s.name === coupling.stage);
    const app = appData.find(app => app.id === coupling.app.id);

    if (app) {
      const appEntry = {
        name: app.name,
        id: app.id,
        formation: app.formation.map(formation => {
          return {
            type: formation.type,
            quantity: formation.quantity,
            size: formation.size,
            command: formation.command,
          }
        }),
        domains: app.domains
      };

      if (stage) {
        stage.apps.push(appEntry);
      } else {
        acc.push({
          name: coupling.stage,
          apps: [appEntry]
        });
      }
    }

    return acc;
  }, [] as { name: string; apps: { name: string; id: string; formation: HerokuFormation[], domains: string[] }[] }[]);

  const orderedStages = orderStages(stages);

  return {
    apiVersion: 'pipeline.heroku.com/v1',
    kind: 'HerokuPipeline',
    metadata: {
      name: pipelineName,
      labels: {
        generated: 'heroku-cli',
      },
    },
    spec: {
      stages: orderedStages
    }
  };
}

function outputYaml(obj: any): string {
  const yaml = require('js-yaml');
  if (obj) {
    return yaml.dump(obj)
  }

  return ''
}

async function toYAML(pipelineId: string): Promise<string> {
  try {
    const [couplings, pipeline] = await Promise.all([
      fetchPipelineCouplings(pipelineId),
      fetchPipelineName(pipelineId)
    ]);

    const appIds = couplings.map(coupling => coupling.app.id);
    const appData = await fetchAppInfo(appIds);

    const herokuPipelineCRD = await convertToHerokuPipelineCRD(couplings, appData, pipeline.name, pipelineId);
    return outputYaml(herokuPipelineCRD);
  } catch (error) {
    console.error('Error:', error);
    return ''
  }
}

interface HerokuDomain {
  hostname: string;
}

async function fetchDomains(appId: string): Promise<string[]> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/apps/${appId}/domains`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${HEROKU_API_KEY}`,
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          // Parse the response and map to an array of hostnames
          const domains: HerokuDomain[] = JSON.parse(data);
          resolve(domains.map(domain => domain.hostname));
        } else {
          reject(new Error(`Failed to fetch app domains: ${res.statusCode} ${res.statusMessage}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}






import * as yaml from 'js-yaml';
import * as crypto from 'crypto';
import fetch from 'node-fetch';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'chap'; // Repository owner's username
const REPO_NAME = 'flow-demo'; // Repository name
const FILE_PATH = '.heroku/flow-demo.yaml';
const COMMIT_MESSAGE = 'Heroku pipeline onboarding.';
const PR_TITLE = '[heroku/cli] pipeline onboarding';

function generateBranchName(): string {
  const prefix = 'heroku/cli/pipeline-onboarding-';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return `${prefix}${randomPart}`;
}

interface FileContent {
  content: string;
  contentSha: string;
  mainSha: string;
}

async function fetchFileContent(): Promise<FileContent> {
  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github.v3.raw; charset=utf-8',
      Authorization: `token ${GITHUB_TOKEN}`
    }
  };

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error fetching file content: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  const contentSha = await generateGitHubBlobSha(content);
  const mainSha = await getLastCommitSha(REPO_OWNER, REPO_NAME);

  return { content, contentSha, mainSha };
}

async function createBranch(sha: string, branchName: string): Promise<void> {
  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: sha,
    }),
  };

  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error creating branch: ${response.status} ${response.statusText}`);
  }
}

async function generateGitHubBlobSha(fileContents: string): Promise<string> {
  const fileContentBuffer = Buffer.from(fileContents, 'utf8');
  const blobHeader = `blob ${fileContentBuffer.length}\0`;
  const blobHeaderBuffer = Buffer.from(blobHeader, 'utf8');
  const combinedBuffer = Buffer.concat([blobHeaderBuffer, fileContentBuffer]);

  const sha1Hash = crypto.createHash('sha1').update(combinedBuffer).digest('hex');
  return sha1Hash;
}

async function getLastCommitSha(owner: string, repo: string): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${GITHUB_TOKEN}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data[0]?.sha
}

async function updateFile(updatedContent: string, sha: string, branchName: string, url: string): Promise<void> {
  const response = await fetch(generateGitHubApiUrl(url), {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: COMMIT_MESSAGE,
      content: btoa(updatedContent),
      sha: sha,
      branch: branchName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error updating file: ${response.status} ${response.statusText}`);
  }
}

interface YAMLUpdateInput {
  app: string;
  type: string;
  quantity: number;
  size: string;
}

function updateYAML(input: YAMLUpdateInput, yamlString: string): string {
  // Parse the YAML string into a JavaScript object
  const yamlObject: any = yaml.load(yamlString);

  // Ensure the 'stages' array exists in the YAML structure
  if (!yamlObject.spec?.stages) {
    throw new Error('The stages block is missing from the YAML content.');
  }

  // Find the relevant app by name
  const stage = yamlObject.spec.stages.find((stage: any) =>
    stage.apps?.some((app: any) => app.name === input.app)
  );
  if (!stage) {
    throw new Error(`App with name "${input.app}" not found.`);
  }

  // Find the relevant formation by type
  const app = stage.apps.find((app: any) => app.name === input.app);
  const formation = app.formation.find((f: any) => f.type === input.type);

  if (!formation) {
    throw new Error(`Formation of type "${input.type}" not found for app "${input.app}".`);
  }

  // Update the quantity and size based on input
  formation.quantity = input.quantity;
  formation.size = input.size.toLowerCase();

  // Convert the updated object back to YAML
  return yaml.dump(yamlObject);
}

async function createPullRequest(branchName: string, prDescription: string): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: PR_TITLE,
      body: prDescription,
      head: branchName,
      base: 'main',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error creating pull request: ${response.status} ${response.statusText}`);
  }

  const pr = await response.json();
  // console.log('Pull Request created:', pr.html_url);
  ux.action.stop(`merge changes to apply:\n-----> ${pr.html_url}`)
}

async function openPullRequest(pipeline: Heroku.Pipeline, url: string): Promise<void> {
  try {

    // const fileData = await fetchFileContent();
    const branchName = generateBranchName();
    const mainSha = await getLastCommitSha(REPO_OWNER, REPO_NAME);
    await createBranch(mainSha, branchName);

    // const appName = getAppNameFromURL(window.location.href);
    // const input: YAMLUpdateInput = { ...JSON.parse(inputString), app: appName || '' };
    // const inputJson = { ...JSON.parse(inputString), app: appName || '' };

    // const updatedFile = updateYAML(input, fileData.content);

    // Compare changes and generate the PR description
    // const prDescription = compareChanges(fileData.content, updatedFile, input);
    // ux.log(`input:${inputString}`)
    // const prDescription = `${appName} formation updated.`

    const pipelineYAML = await toYAML(pipeline.id!)
    const contentSha = await generateGitHubBlobSha(pipelineYAML);
    await updateFile(pipelineYAML, contentSha, branchName, url);

    const prDescription = `Get started with Heroku GitOps:
    
1. Merge this pull request
2. Enable GitOps feature flag:\n\`heroku features:enable ${PipelinesOnboard.featureFlagName} -a ${pipeline.name!}\`

While enabled, all Heroku settings must be configured via this repository.

> [!WARNING]
> Commits to the main branch may cause an increase in Heroku charges.\n> \n> Review [branch protections](https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/branches) and access controls for this repo before merging.`

    await createPullRequest(branchName, prDescription);
  } catch (error) {
    console.error('Error in the PR process:', error);
  }
}

// function compareChanges(previousContent: string, updatedContent: string, input: any): string {
  // import * as yaml from 'js-yaml';

interface DynoCosts {
  monthly: number;
  hourly: number;
}

interface Formation {
  type: string;
  quantity: number;
  size: string;
}

interface App {
  name: string;
  formation: Formation[];
}

interface Stage {
  apps?: App[];
}

interface Spec {
  stages: Stage[];
}

interface YamlData {
  spec: Spec;
}

interface Input {
  app: string;
  type: string;
}

function compareChanges(previousContent: string, updatedContent: string, input: Input): string {
  const dynoCosts: Record<string, DynoCosts> = {
    'eco': { monthly: 5, hourly: 0.005 },
    'basic': { monthly: 7, hourly: 0.01 },
    'standard-1x': { monthly: 25, hourly: 0.03 },
    'standard-2x': { monthly: 50, hourly: 0.06 },
    'performance-m': { monthly: 250, hourly: 0.34 },
    'performance-l': { monthly: 500, hourly: 0.69 },
    'performance-l-ram': { monthly: 500, hourly: 0.69 },
    'performance-xl': { monthly: 750, hourly: 1.04 },
    'performance-2xl': { monthly: 1500, hourly: 2.08 }
  };

  // Parse the YAML strings to JSON objects
  const previousYaml = yaml.load(previousContent) as YamlData;
  const updatedYaml = yaml.load(updatedContent) as YamlData;

  if (!previousYaml.spec.stages || !updatedYaml.spec.stages) {
    throw new Error('The stages block is missing from the YAML content.');
  }

  const appName = input.app;
  const formationType = input.type;

  if (!appName) {
    throw new Error(`App name is not defined in input: ${JSON.stringify(input)}`);
  }

  const findAppInStages = (yamlData: YamlData): App | null => {
    for (const stage of yamlData.spec.stages) {
      const foundApp = stage.apps?.find(app => app.name === appName);
      if (foundApp) {
        return foundApp;
      }
    }
    return null;
  };

  const previousApp = findAppInStages(previousYaml);
  const updatedApp = findAppInStages(updatedYaml);

  if (!previousApp || !updatedApp) {
    throw new Error(`App with name "${appName}" not found in the YAML content.`);
  }

  if (!previousApp.formation || !updatedApp.formation) {
    throw new Error('Formation block is missing for the specified app.');
  }

  const previousFormation = previousApp.formation.find(form => form.type === formationType);
  const updatedFormation = updatedApp.formation.find(form => form.type === formationType);

  if (!previousFormation || !updatedFormation) {
    throw new Error(`Formation type "${formationType}" not found for app "${appName}".`);
  }

  const previousQuantity = previousFormation.quantity;
  const updatedQuantity = updatedFormation.quantity;

  const previousSize = previousFormation.size.toLowerCase();
  const updatedSize = updatedFormation.size.toLowerCase();

  // Generate the summary for the pull request description
  let prBody = `Update formation of <a href="https://dashboard.heroku.com/apps/${appName}/resources">Heroku app</a> \`${appName}\`.\n\n`;

  prBody += `type: ${formationType}\n`;

  if (String(previousQuantity) !== String(updatedQuantity)) {
    prBody += `quantity: **${updatedQuantity}** (from ${previousQuantity})\n`;
  }

  if (previousSize !== updatedSize) {
    prBody += `size: **${updatedSize}** (from ${previousSize})\n`;
  }

  // Calculate the cost difference
  const previousCost = previousQuantity * dynoCosts[previousSize].monthly;
  const updatedCost = updatedQuantity * dynoCosts[updatedSize].monthly;
  const costDifference = updatedCost - previousCost;

  // Determine the change in hourly rates
  const previousHourlyRate = previousQuantity * dynoCosts[previousSize].hourly;
  const updatedHourlyRate = updatedQuantity * dynoCosts[updatedSize].hourly;

  // Set the message for cost increase or decrease using GitHub-style blocks
  if (costDifference > 0) {
    prBody += `\n> [!WARNING]\n> App costs will INCREASE by **~${costDifference.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/month**. \n${previousHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/hour vs ${updatedHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/hour\n\n---\n\n`;
  } else if (costDifference < 0) {
    prBody += `\n> [!TIP]\n> App costs will DECREASE by **~${Math.abs(costDifference).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/month**. \n${previousHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/hour vs ${updatedHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/hour\n\n---\n\n`;
  } else {
    prBody += `\n> [!NOTE]\n> No change in costs. (${previousHourlyRate.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}/hour)\n\n`;
  }

  prBody += `Check current formation:\n\`\`\`\nheroku ps -a ${appName}\n\`\`\``;

  return prBody.trim(); // Remove trailing whitespace
}

function generateGitHubApiUrl(githubUrl: string): string {
  const urlPattern = /https:\/\/github.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)/;
  const match = githubUrl.match(urlPattern);

  if (!match) {
      throw new Error("Invalid GitHub URL format");
  }

  const [, repoOwner, repoName, branch, filePath] = match;
  return `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`;
}







import * as fs from 'fs';
import * as path from 'path';

function findGitConfig(directory: string): string | null {
  const gitConfigPath = path.join(directory, '.git', 'config');
  if (fs.existsSync(gitConfigPath)) {
    return gitConfigPath;
  }
  const parentDir = path.dirname(directory);
  if (parentDir !== directory) {
    return findGitConfig(parentDir); // Search parent directories
  }
  return null;
}

function extractOriginUrl(configFilePath: string): string | null {
  const configFile = fs.readFileSync(configFilePath, 'utf8');
  const originPattern = /\[remote "origin"\]\s+url = (.+)/;
  const match = configFile.match(originPattern);

  if (match) {
    const originUrl = match[1];
    // Clean up SSH URL if necessary (convert SSH URL to HTTPS)
    if (originUrl.startsWith('git@')) {
      return originUrl.replace('git@', 'https://').replace(':', '/');
    }
    return originUrl;
  }
  return null;
}

function generateGitHubUrl(originUrl: string, filePath: string): string {
  const originPattern = /https:\/\/([^\/]+)\/([^\/]+)\/([^\/]+)\.git/;
  const match = originUrl.match(originPattern);

  if (!match) {
    throw new Error("Invalid origin URL format");
  }

  const [, domain, repoOwner, repoName] = match;
  return `https://${domain}/${repoOwner}/${repoName}/blob/main/${filePath}`;
}

function stringPresent(url?: string | null): boolean {
  return url !== null && url !== undefined && url.trim() !== '';
}