`heroku ai`
===========

manage Heroku AI models

* [`heroku ai:agents:call [MODEL_RESOURCE]`](#heroku-aiagentscall-model_resource)
* [`heroku ai:docs`](#heroku-aidocs)
* [`heroku ai:mcp [ADDON]`](#heroku-aimcp-addon)
* [`heroku ai:models`](#heroku-aimodels)
* [`heroku ai:models:attach MODEL_RESOURCE`](#heroku-aimodelsattach-model_resource)
* [`heroku ai:models:call MODEL_RESOURCE`](#heroku-aimodelscall-model_resource)
* [`heroku ai:models:create MODEL_NAME`](#heroku-aimodelscreate-model_name)
* [`heroku ai:models:destroy MODEL_RESOURCE`](#heroku-aimodelsdestroy-model_resource)
* [`heroku ai:models:detach MODEL_RESOURCE`](#heroku-aimodelsdetach-model_resource)
* [`heroku ai:models:info [MODEL_RESOURCE]`](#heroku-aimodelsinfo-model_resource)
* [`heroku ai:models:list`](#heroku-aimodelslist)
* [`heroku ai:tools:list [ADDON]`](#heroku-aitoolslist-addon)

## `heroku ai:agents:call [MODEL_RESOURCE]`

make an inference request to the Heroku Inference Agents API

```
USAGE
  $ heroku ai:agents:call [MODEL_RESOURCE] [-a <value>] [-j | -o <value>] [--optfile <value> | --opts <value>] [-p
    <value> | --messages <value>] [-r <value>]

ARGUMENTS
  [MODEL_RESOURCE]  [default: heroku-inference] resource ID or alias of model (--app flag required if alias is used)

FLAGS
  -a, --app=<value>       name or ID of app (required if alias is used)
  -j, --json              output response as JSON
  -o, --output=<value>    file path where command writes the model response
  -p, --prompt=<value>    input prompt for model (will be converted to a user message)
  -r, --remote=<value>    git remote of app to use
      --messages=<value>  JSON array of messages to send to the model
      --optfile=<value>   additional options for model inference, provided as a JSON config file
      --opts=<value>      additional options for model inference, provided as a JSON string

DESCRIPTION
  make an inference request to the Heroku Inference Agents API

EXAMPLES
  $ heroku ai:agents:call my_llm --app my-app --prompt "What is the current time?"

  $ heroku ai:agents:call my_llm --app my-app --messages '[{"role":"user","content":"What is the current time?"}]'
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/agents/call.ts)_

## `heroku ai:docs`

open Heroku Managed Inference and Agent's Dev Center documentation in your browser

```
USAGE
  $ heroku ai:docs [--browser <value>]

FLAGS
  --browser=<value>  browser to open docs with (example: "firefox", "safari")

DESCRIPTION
  open Heroku Managed Inference and Agent's Dev Center documentation in your browser
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/docs.ts)_

## `heroku ai:mcp [ADDON]`

list the MCP server URL

```
USAGE
  $ heroku ai:mcp [ADDON] [--json] [-a <value>]

ARGUMENTS
  [ADDON]  [default: heroku-inference] unique identifier or globally unique name of add-on

FLAGS
  -a, --app=<value>  app to list the MCP server URL for
      --json         output in JSON format

DESCRIPTION
  list the MCP server URL
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/mcp/index.ts)_

## `heroku ai:models`

list available AI models to provision access to

```
USAGE
  $ heroku ai:models

DESCRIPTION
  list available AI models to provision access to

ALIASES
  $ heroku ai:models

EXAMPLES
  $ heroku ai:models:list
```

## `heroku ai:models:attach MODEL_RESOURCE`

attach an existing model resource to an app

```
USAGE
  $ heroku ai:models:attach MODEL_RESOURCE -s <value> -t <value> [--as <value>] [--confirm <value>] [-r <value>]

ARGUMENTS
  MODEL_RESOURCE  resource ID or alias of model resource to attach

FLAGS
  -r, --remote=<value>      git remote of target app
  -s, --source-app=<value>  (required) source app for model resource
  -t, --target-app=<value>  (required) target app for model resource
      --as=<value>          alias name for model resource
      --confirm=<value>     overwrite existing attached resource with same name

DESCRIPTION
  attach an existing model resource to an app

EXAMPLES
  $ heroku ai:models:attach claude-3-5-sonnet-acute-41518 --source-app example-source-app --target-app example-target-app

  $ heroku ai:models:attach claude-3-5-sonnet-acute-41518 --source-app example-source-app --target-app example-target-app --as MY_CS35
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/attach.ts)_

## `heroku ai:models:call MODEL_RESOURCE`

make an inference request to a specific AI model resource

```
USAGE
  $ heroku ai:models:call MODEL_RESOURCE [-a <value>] [-j] [--optfile <value>] [--opts <value>] [-o <value>] [-p
    <value>] [-r <value>]

ARGUMENTS
  MODEL_RESOURCE  resource ID or alias of model (--app flag required if alias is used)

FLAGS
  -a, --app=<value>      name or ID of app (required if alias is used)
  -j, --json             output response as JSON
  -o, --output=<value>   file path where command writes the model response
  -p, --prompt=<value>   input prompt for model
  -r, --remote=<value>   git remote of app to use
      --optfile=<value>  additional options for model inference, provided as a JSON config file
      --opts=<value>     additional options for model inference, provided as a JSON string

DESCRIPTION
  make an inference request to a specific AI model resource

EXAMPLES
  $ heroku ai:models:call my_llm --app my-app --prompt "What is the meaning of life?" 

  $ heroku ai:models:call diffusion --app my-app --prompt "Generate an image of a sunset" --opts '{"quality":"hd"}' -o sunset.png
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/call.ts)_

## `heroku ai:models:create MODEL_NAME`

provision access to an AI model

```
USAGE
  $ heroku ai:models:create MODEL_NAME -a <value> [--as <value>] [--confirm <value>] [-r <value>]

ARGUMENTS
  MODEL_NAME  name of AI model to provision access for

FLAGS
  -a, --app=<value>      (required) name of app to attach model to
  -r, --remote=<value>   git remote of app to use
      --as=<value>       alias of model resource
      --confirm=<value>  overwrite existing config vars or existing add-on aliases

DESCRIPTION
  provision access to an AI model

EXAMPLES
  # Provision access to an AI model and attach it to your app with a default name:
  $ heroku ai:models:create claude-3-5-sonnet --app example-app
  # Provision access to an AI model and attach it to your app with a custom name:
  $ heroku ai:models:create stable-image-ultra --app example-app --as diffusion
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/create.ts)_

## `heroku ai:models:destroy MODEL_RESOURCE`

destroy an existing AI model resource

```
USAGE
  $ heroku ai:models:destroy MODEL_RESOURCE -a <value> [-c <value>] [-f] [-r <value>]

ARGUMENTS
  MODEL_RESOURCE  resource ID or alias of model resource to destroy

FLAGS
  -a, --app=<value>      (required) app to run command against
  -c, --confirm=<value>  set to app name to bypass confirmation prompt
  -f, --force            allow destruction even if connected to other apps
  -r, --remote=<value>   git remote of app to use

DESCRIPTION
  destroy an existing AI model resource

EXAMPLES
  $ heroku ai:models:destroy claude-3-5-sonnet-acute-43973
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/destroy.ts)_

## `heroku ai:models:detach MODEL_RESOURCE`

detach a model resource from an app

```
USAGE
  $ heroku ai:models:detach MODEL_RESOURCE -a <value> [-r <value>]

ARGUMENTS
  MODEL_RESOURCE  alias of model resource to detach

FLAGS
  -a, --app=<value>     (required) name of app to detach model resource from
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  detach a model resource from an app

EXAMPLES
  $ heroku ai:models:detach EXAMPLE_MODEL_ALIAS --app example-app
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/detach.ts)_

## `heroku ai:models:info [MODEL_RESOURCE]`

get current status of a specific AI model resource or all AI model resources attached to an app

```
USAGE
  $ heroku ai:models:info [MODEL_RESOURCE] -a <value> [-r <value>]

ARGUMENTS
  [MODEL_RESOURCE]  resource ID or alias of model resource

FLAGS
  -a, --app=<value>     (required) app to run command against
  -r, --remote=<value>  git remote of app to use

DESCRIPTION
  get current status of a specific AI model resource or all AI model resources attached to an app

EXAMPLES
  $ heroku ai:models:info claude-3-5-sonnet-acute-04281 --app example-app 

  $ heroku ai:models:info --app example-app
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/info.ts)_

## `heroku ai:models:list`

list available AI models to provision access to

```
USAGE
  $ heroku ai:models:list

DESCRIPTION
  list available AI models to provision access to

ALIASES
  $ heroku ai:models

EXAMPLES
  $ heroku ai:models:list
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/models/list.ts)_

## `heroku ai:tools:list [ADDON]`

list all available AI tools

```
USAGE
  $ heroku ai:tools:list [ADDON] [--json] [-a <value>]

ARGUMENTS
  [ADDON]  [default: heroku-inference] unique identifier or globally unique name of add-on

FLAGS
  -a, --app=<value>  app to list tools for
      --json         output in JSON format

DESCRIPTION
  list all available AI tools
```

_See code: [@heroku/plugin-ai](https://github.com/heroku/heroku-cli-plugin-ai/blob/v1.0.2/src/commands/ai/tools/list.ts)_
