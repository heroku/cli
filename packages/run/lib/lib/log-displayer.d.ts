import { APIClient } from '@heroku-cli/command';
interface LogDisplayerOptions {
    app: string;
    dyno: string;
    lines?: number;
    tail: boolean;
    source?: string;
}
declare function logDisplayer(heroku: APIClient, options: LogDisplayerOptions): Promise<unknown>;
export default logDisplayer;
