export default {
  additionalHelpFlags: ['-h'],
  additionalVersionFlags: ['-v', 'version'],
  aliases: {
    '@heroku/plugin-sudo': '@heroku/sudo',
    '@heroku-cli/config-edit': null,
    '@heroku-cli/plugin-sudo': '@heroku/sudo',
    'heroku-api-plugin': 'api',
    'heroku-certs-acm': null,
    'heroku-cli-api': 'api',
    'heroku-cli-autocomplete': null,
    'heroku-cli-buildpacks': 'buildpack-registry',
    'heroku-cli-config-edit': null,
    'heroku-cli-deploy': 'java',
    'heroku-cli-java': 'java',
    'heroku-cli-plugin-generator': null,
    'heroku-container-registry': null,
    'heroku-event-log': '@heroku/event-log',
    'heroku-pg-extras': '@heroku-cli/heroku-pg-extras',
    'heroku-pipelines': null,
    'heroku-ps-wait': null,
    'heroku-redis': null,
    'heroku-repo': '@heroku-cli/plugin-heroku-repo',
    'heroku-skynet-cli': '@heroku/skynet',
    'heroku-splunk': '@heroku/splunk',
    'heroku-sudo': '@heroku/sudo',
    'heroku-webhooks': null,
    sudo: '@heroku/sudo',
  },
  bin: 'heroku',
  commands: './lib/commands',
  dirname: 'heroku',
  hooks: {
    command_not_found: ['./lib/hooks/command_not_found/performance_analytics'],
    init: [
      './lib/hooks/init/version',
      './lib/hooks/init/terms-of-service',
      './lib/hooks/init/performance_analytics',
    ],
    postrun: ['./lib/hooks/postrun/performance_analytics'],
    prerun: ['./lib/hooks/prerun/analytics'],
    recache: './lib/hooks/recache',
    update: [
      './lib/hooks/update/plugin-migrate',
      './lib/hooks/update/brew',
      './lib/hooks/update/completions',
      './lib/hooks/update/tidy',
      './lib/hooks/recache',
    ],
  },
  macos: {
    identifier: 'com.heroku.cli',
    sign: 'Developer ID Installer: Heroku INC',
  },
  npmRegistry: 'https://registry.npmjs.org',
  plugins: [
    '@oclif/plugin-legacy',
    '@heroku-cli/plugin-ps-exec',
    '@oclif/plugin-commands',
    '@oclif/plugin-help',
    '@oclif/plugin-not-found',
    '@oclif/plugin-plugins',
    '@oclif/plugin-update',
    '@oclif/plugin-version',
    '@oclif/plugin-warn-if-update-available',
    '@oclif/plugin-which',
    '@heroku/plugin-ai',
  ],
  repositoryPrefix: '<%- repo %>/blob/v<%- version %>/<%- commandPath %>',
  scope: 'heroku-cli',
  topics: {
    '2fa': {
      description: 'two-factor authentication',
      hidden: true,
    },
    access: {
      description: 'manage user access to apps',
    },
    addons: {
      description: 'tools and services for developing, extending, and operating your app',
    },
    apps: {
      description: 'manage apps on Heroku',
    },
    auth: {
      description: 'manage authentication for your Heroku account',
    },
    authorizations: {
      description: 'OAuth authorizations',
    },
    buildpacks: {
      description: 'scripts used to compile apps',
    },
    certs: {
      description: 'SSL certificates',
    },
    ci: {
      description: 'test runner for Heroku Pipelines',
    },
    clients: {
      description: 'OAuth clients on the platform',
    },
    commands: {
      hidden: true,
    },
    config: {
      description: 'environment variables of apps',
    },
    container: {
      description: 'deploy your Docker-based app to Heroku',
    },
    domains: {
      description: 'custom domains for apps',
    },
    drains: {
      description: 'forward logs to syslog or HTTPS',
    },
    dyno: {
      hidden: true,
    },
    features: {
      description: 'add/remove app features',
    },
    git: {
      description: 'set git remote and clone Heroku repository',
    },
    keys: {
      description: 'add/remove account ssh keys',
    },
    labs: {
      description: 'add/remove experimental features',
    },
    local: {
      description: 'run Heroku app locally',
    },
    logs: {
      description: 'display recent log output',
    },
    maintenance: {
      description: 'enable/disable access to app',
    },
    members: {
      description: 'manage organization members',
    },
    orgs: {
      description: 'manage organizations',
    },
    pg: {
      description: 'manage postgresql databases',
    },
    pipelines: {
      description: 'manage pipelines',
    },
    ps: {
      description: 'manage app dynos',
    },
    redis: {
      description: 'manage heroku redis instances',
    },
    reviewapps: {
      description: 'manage reviewapps in pipelines',
    },
    run: {
      description: 'run a one-off process inside a Heroku dyno',
    },
    sessions: {
      description: 'OAuth sessions',
    },
    stack: {
      description: 'list available stacks',
      hidden: true,
    },
    teams: {
      description: 'manage teams',
    },
    twofactor: {
      description: 'two-factor authentication',
      hidden: true,
    },
    update: {
      description: 'update the Heroku CLI',
    },
    which: {
      hidden: true,
    },
  },
  update: {
    node: {
      version: '22.22.0',
    },
    s3: {
      bucket: 'heroku-cli-assets',
      host: 'https://cli-assets.heroku.com',
      xz: true,
    },
  },
  windows: {
    name: 'Heroku CLI',
  },
}
