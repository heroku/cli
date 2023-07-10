import { APIClient } from '@heroku-cli/command';
import Heroku from '@heroku-cli/schema';
export default function renderPipeline(heroku: APIClient, pipeline: Heroku.Pipeline, pipelineApps: Array<Heroku.App>, { withOwners, showOwnerWarning }?: {
    withOwners: boolean;
    showOwnerWarning: boolean;
}): Promise<void>;
