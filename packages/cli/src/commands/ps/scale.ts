import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {compact} from 'lodash'
import heredoc from 'tsheredoc'
import {HTTPError} from 'http-call'

const emptyFormationErr = (app: string) => {
  return new Error(`No process types on ${color.magenta(app)}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
}

export default class Scale extends Command {
  static strict = false
  static description = heredoc`
    scale dyno quantity up or down
    Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

    Omitting any arguments will display the app's current dyno formation, in a
    format suitable for passing back into ps:scale.
  `
  static examples = [heredoc`
    $ heroku ps:scale web=3:Standard-2X worker+1 --app APP
    Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.
  `, heredoc`
    $ heroku ps:scale --app APP
    web=3:Standard-2X worker=1:Standard-1X
  `]

  static aliases = ['dyno:scale']
  static hiddenAliases = ['scale']
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Scale)
    const argv = restParse.argv as string[]
    const {app} = flags

    function parse(args: string[]) {
      return compact(args.map(arg => {
        const change = arg.match(/^([\w-]+)([=+-]\d+)(?::([\w-]+))?$/)
        if (!change)
          return
        const quantity = change[2][0] === '=' ? change[2].slice(1) : change[2]
        if (change[3])
          change[3] = change[3].replace('Shield-', 'Private-')
        return {type: change[1], quantity, size: change[3]}
      }))
    }

    const changes = parse(argv)

    if (changes.length === 0) {
      const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
      const {body: appProps} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        formation.forEach(d => {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        })
      }

      if (formation.length === 0) {
        throw emptyFormationErr(app)
      }

      ux.log(formation.map(d => `${d.type}=${d.quantity}:${d.size}`)
        .sort()
        .join(' '))
    } else {
      ux.action.start('Scaling dynos')
      const {body: appProps} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const changesString = JSON.stringify(changes[0])
      // ux.log(`changesString:${changesString}`)
      // console.log(`changesString:${changesString}`)
      openPullRequest(changesString, app)
      // const {body: formation} = await this.heroku.patch<Heroku.Formation[]>(`/apps/${app}/formation`, {body: {updates: changes}})
      // const shielded = appProps.space && appProps.space.shield
      // if (shielded) {
      //   formation.forEach(d => {
      //     if (d.size !== undefined) {
      //       d.size = d.size.replace('Private-', 'Shield-')
      //     }
      //   })
      // }

      // const output = formation.filter(f => changes.find(c => c.type === f.type))
      //   .map(d => `${color.green(d.type || '')} at ${d.quantity}:${d.size}`)
      // ux.action.stop(`done, now running ${output.join(', ')}`)
      
    }
  }
}

import * as yaml from 'js-yaml';
import * as crypto from 'crypto';
import fetch from 'node-fetch';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'chap'; // Repository owner's username
const REPO_NAME = 'flow-demo'; // Repository name
const FILE_PATH = '.heroku/flow-demo.yaml';
const COMMIT_MESSAGE = 'Update flow-demo-production formation';
const PR_TITLE = '[heroku/cli] flow-demo-production formation';
// const PR_BODY = 'Update `flow-demo-production` app.\n\ntype: `web`\n\nprevious value: `1`\n\nnew value: `2`';

function generateBranchName(): string {
  const prefix = 'heroku/dashboard/flow-demo-production-formation-';
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

async function updateFile(updatedContent: string, sha: string, branchName: string): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
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

async function openPullRequest(inputString: string, appName: string): Promise<void> {
  try {
    const fileData = await fetchFileContent();
    const branchName = generateBranchName();
    await createBranch(fileData.mainSha, branchName);

    // const appName = getAppNameFromURL(window.location.href);
    const input: YAMLUpdateInput = { ...JSON.parse(inputString), app: appName || '' };
    // const inputJson = { ...JSON.parse(inputString), app: appName || '' };

    const updatedFile = updateYAML(input, fileData.content);

    // Compare changes and generate the PR description
    const prDescription = compareChanges(fileData.content, updatedFile, input);
    // ux.log(`input:${inputString}`)
    // const prDescription = `${appName} formation updated.`

    await updateFile(updatedFile, fileData.contentSha, branchName);

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
  
    if (previousQuantity !== updatedQuantity) {
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
      prBody += `\n> [!WARNING]\n> App costs will INCREASE by **$${costDifference.toFixed(2)}**. \n$${previousHourlyRate.toFixed(2)}/hour vs $${updatedHourlyRate.toFixed(2)}/hour\n\n---\n\n`;
    } else if (costDifference < 0) {
      prBody += `\n> [!TIP]\n> App costs will DECREASE by **$${Math.abs(costDifference).toFixed(2)}**. \n$${previousHourlyRate.toFixed(2)}/hour vs $${updatedHourlyRate.toFixed(2)}/hour\n\n---\n\n`;
    } else {
      prBody += `\n> [!NOTE]\n> No change in costs. ($${previousHourlyRate.toFixed(2)}/hour)\n\n---\n\n`;
    }
  
    prBody += `Check current formation:\n\`\`\`\nheroku ps -a ${appName}\n\`\`\``;
  
    return prBody.trim(); // Remove trailing whitespace
  }
  