import { APIClient } from '@heroku-cli/command';
import Heroku from '@heroku-cli/schema';
export default function disambiguate(heroku: APIClient, pipelineIDOrName: string): Promise<Heroku.Pipeline>;
