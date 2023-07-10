import { APIClient } from '@heroku-cli/command';
import Heroku from '@heroku-cli/schema';
export declare function warnMixedOwnership(pipelineApps: Array<Heroku.App>, pipeline: Heroku.Pipeline, owner: string): void;
export declare function getOwner(heroku: APIClient, apps: Array<Heroku.App>, pipeline: Heroku.Pipeline): Promise<any>;
