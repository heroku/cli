import { Command } from '@heroku-cli/command';
import * as Heroku from '@heroku-cli/schema';
export declare function renderList(command: Command, testRuns: Heroku.TestRun[], pipeline: Heroku.Pipeline, watchOption: boolean, jsonOption: boolean): Promise<void>;
export declare function displayAndExit(pipeline: Heroku.Pipeline, number: number, command: Command): Promise<void>;
export declare function displayTestRunInfo(command: Command, testRun: Heroku.TestRun, testNodes: Heroku.TestNode[], nodeArg: string | undefined): Promise<void>;
