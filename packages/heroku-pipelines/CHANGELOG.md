Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [2.5.0] 2017-11-20

- Update `pipelines:transfer` to perform a full transfer including apps in the pipeline.

## [2.4.0] 2017-10-11

- Add `pipelines:transfer` command to set and update the pipeline owner.

## [2.3.1] 2017-09-13

- Fixes serialization for `pipelines:info --json`. https://github.com/heroku/heroku-pipelines/pull/72 changed the serialization for that command changing `apps` to `pipelineApps`.

## [2.3.0] 2017-09-12

- Update help output of `pipelines:info`
- Show warning when operating in an owned pipeline with apps with different owners with the `pipelines:info` command.
- Add support for creating a pipeline with an owner. Uses the personal account as owner if no owner is specified via `--team` or `--org`
- Update `pipelines:setup` to use `--org` rather than `--organization` when creating a pipeline to an organization. This is to preserve consistency with other CLI commands.
- Add stage flag options completion

## [2.2.0] 2017-09-06

- Show pipeline owner when it has one set in the command `pipelines:info`
- Update the output format to use columns in `pipelines:info` so it's more machine readable (grep-parsable)
- Add support for hidden flag `--with-owners` to show app owner in all pipeline-couplings in `pipelines:info`


## [2.1.3] - 2017-06-30
### Changed
- Loosened dependencies
