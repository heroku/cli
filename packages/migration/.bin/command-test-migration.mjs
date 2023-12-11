#!/usr/bin/env node
import { CommandTestMigrationFactory } from '../lib/index.js';
import { globSync } from 'glob';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import path from 'node:path';
import ts from 'typescript';

// --files="globPattern"
// --outdir="some/path/to/output"
// --overwrite boolean, will overwrite existing files
const { argv } = yargs(hideBin(process.argv));

const filesParts = argv.files.split(',')
const files = filesParts.reduce((acc, filePath) => (
  [...acc, ...globSync(filePath).map(file => file.replace("/", path.sep))]
), []);

const commandMigrationFactory = new CommandTestMigrationFactory(
  files,
  {
    moduleResolution: ts.ModuleResolutionKind.Node10,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
    allowJs: true,
  },
  argv.outdir,
  argv.overwrite
);

void commandMigrationFactory.migrate();
