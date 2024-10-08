import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {listPipelineApps} from '../../lib/api'
import disambiguate from '../../lib/pipelines/disambiguate'
import renderPipeline from '../../lib/pipelines/render-pipeline'

export default class PipelinesInfo extends Command {
  static description = 'show list of apps in a pipeline'

  static examples = [
    '$ heroku pipelines:info my-pipeline',
  ]

  static flags = {
    json: flags.boolean({
      description: 'output in json format',
    }),
    yaml: flags.boolean({
      description: 'output in yaml format',
    }),
    'with-owners': flags.boolean({
      description: 'shows owner of every app',
      hidden: true,
    }),
  }

  static args = {
    pipeline: Args.string({
      description: 'pipeline to show list of apps for',
      required: true,
    }),
  }

  async run() {
    const {args, flags} = await this.parse(PipelinesInfo)
    const pipeline: Heroku.Pipeline = await disambiguate(this.heroku, args.pipeline)
    const pipelineApps = await listPipelineApps(this.heroku, pipeline.id!)

    if (flags.json) {
      ux.styledJSON({pipeline, apps: pipelineApps})
    } else if (flags.yaml) {
      // ux.styledJSON({pipeline, apps: pipelineApps})
      const HEROKU_API_KEY = process.env.HEROKU_API_KEY || ""
      main(pipeline.id!, HEROKU_API_KEY)
    } else {
      await renderPipeline(this.heroku, pipeline, pipelineApps, {
        withOwners: flags['with-owners'],
        showOwnerWarning: true,
      })
    }
  }
}


const https = require('https');

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

function fetchPipelineCouplings(pipelineId: string, apiKey: string): Promise<HerokuPipelineCoupling[]> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/pipelines/${pipelineId}/pipeline-couplings`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

function fetchPipelineName(pipelineId: string, apiKey: string): Promise<HerokuPipeline> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/pipelines/${pipelineId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

function fetchAppName(appId: string, apiKey: string): Promise<HerokuApp> {
  const options = {
    hostname: 'api.heroku.com',
    path: `/apps/${appId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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

async function fetchAppNames(appIds: string[], apiKey: string): Promise<{ id: string, name: string }[]> {
  const promises = appIds.map(appId => fetchAppName(appId, apiKey));
  return Promise.all(promises);
}

function orderStages(stages: { name: string; apps: { name: string; id: string }[] }[]): { name: string; apps: { name: string; id: string }[] }[] {
  const order = ['development', 'staging', 'production'];

  return stages.sort((a, b) => {
    const indexA = order.indexOf(a.name);
    const indexB = order.indexOf(b.name);
    return indexA - indexB;
  });
}

async function convertToHerokuPipelineCRD(couplings: HerokuPipelineCoupling[], appData: { id: string, name: string }[], pipelineName: string) {
  const stages = couplings.reduce((acc, coupling) => {
    const stage = acc.find(s => s.name === coupling.stage);
    const app = appData.find(app => app.id === coupling.app.id);

    if (app) {
      const appEntry = {
        name: app.name,
        id: app.id
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
  }, [] as { name: string; apps: { name: string; id: string }[] }[]);

  const orderedStages = orderStages(stages);

  return {
    apiVersion: 'pipeline.heroku.com/v1',
    kind: 'HerokuPipeline',
    metadata: {
      name: pipelineName,
      namespace: 'default',
    },
    spec: {
      stages: orderedStages
    }
  };
}

function outputYaml(obj: any) {
  const yaml = require('js-yaml');
  if (obj) {
    console.log(yaml.dump(obj));
  } else {
    console.error('Error: Failed to convert pipeline data to CRD.');
  }
}

async function main(pipelineId: string, apiKey: string) {
  try {
    const [couplings, pipeline] = await Promise.all([
      fetchPipelineCouplings(pipelineId, apiKey),
      fetchPipelineName(pipelineId, apiKey)
    ]);

    const appIds = couplings.map(coupling => coupling.app.id);
    const appData = await fetchAppNames(appIds, apiKey);

    const herokuPipelineCRD = await convertToHerokuPipelineCRD(couplings, appData, pipeline.name);
    outputYaml(herokuPipelineCRD);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example usage: main('your-pipeline-id', 'your-heroku-api-key');
