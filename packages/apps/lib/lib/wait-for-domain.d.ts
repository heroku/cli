import { APIClient } from '@heroku-cli/command';
import * as Heroku from '@heroku-cli/schema';
export default function waitForDomain(app: string, heroku: APIClient, domain: Heroku.Domain): Promise<void>;
