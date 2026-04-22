# AGENTS.md - Guidelines for AI Agents Working on CLI

This document provides guidelines for AI agents (like Claude, Copilot, Cursor, etc.) working on this CLI codebase. These rules are derived from [RFC 000282: CLI Design Patterns and Best Practices](https://github.com/heroku/rfcs/blob/main/approved/000282-CLI-Design-Patterns.md).

**Important:** These are best practices to create a cohesive, predictable user experience. If a particular scenario doesn't align with these conventions, prioritize what's best for the customer and feature requirements.

## Command Names and Topics

- **Lowercase and Hyphenated:** All topic and command names should be lowercase and use hyphens (`-`) as separators for multi-word names
- **Plural Nouns for Topics:** The topic immediately preceding a command should be a plural noun. Topics that serve as logical organizers for whole sections of commands can be a descriptive noun
- **Action Verbs for Commands:** Command names should begin with an action verb describing the operation being performed. Terms should be predictable, consistent, and memorable

Common verbs for command operations:
- **create** - for creating a new resource
- **add** - for adding a resource to a collection/list
- **destroy** - for destroying a resource entirely
- **remove** - for removing a resource from a collection/list
- **update** - for modifying an existing resource

The index of a command serves as the command for listing resources.

## Arguments and Flags

- If the command requires parameters, the ARGUMENT to the command should serve as the primary input (i.e., the name or id of the associated resource)
- There should never be more than one optional ARGUMENT
- **In general, flags are preferred to args**
  - Commands that will only ever have one input, an arg can be appropriate
- **Limit the number of required flags and arguments**
  - Make use of default values where possible
  - Consider a prompt-based flow for a command that has many required inputs
- Flags should have descriptive words as default with a shorthand if appropriate
- If the name of an argument requires multiple words, separate them with underscores
- Multiple key-value input values with unknown key labels should be passed in using the "multiple: true" oclif option, which provides for allowing a flag to be submitted multiple times (e.g.: `--option key1=value1 --option key2=value2`)

## Language and Help Text

- Terms used to describe features and Heroku primitives should align with how they're described in Dev Center articles (particularly as described in the published [Platform API reference](https://devcenter.heroku.com/articles/platform-api-reference))
- There should be description text for each command, flag, and argument
- There should be at least one example for each command. If there are multiple important flows, multiple examples are appropriate
- Examples should use the longform flag (e.g., `--app` instead of `-a`)
- Examples should refer to user apps as `example-app`, unless more descriptive language is needed (e.g. `example-source-app`)
- Description should include clear, descriptive text that humans can understand and LLM agents can interpret
- **Keep all descriptions clear and concise. Fragments are preferable to sentences. Start with lowercase and if it's a fragment, don't end with a period**
- If settings are configurable, note that either in description or output text
- Add a Dev Center link if it's important for user comprehension

## Output and Exit Codes

- In the event any part of the execution of a command fails, the command should return a non-zero exit code, which can be accomplished by:
  - Allowing an uncaught exception to go uncaught (oclif will return the error message to the user)
  - Use oclif's explicit exit function (ux.exit, or this.exit)
- Commands that succeed return 0
- All commands produce some output upon completion

## Data Handling

- Network requests should utilize the custom fetch-based API Client described in the heroku-fetch RFC once that is ready
  - Consistent translation of data for our common tooling and components
  - Ensures a consistent debugging experience
- Use schema defined types where possible, such as found in [typescript-api-schema](https://github.com/heroku/typescript-api-schema)
- **Default to passing through Platform API error messages to the user**
- **Thin data validation in the CLI**
  - Do not replicate complicated validation logic that exists in the API
  - Make use of basic validation where it makes sense
- **Limit number of blocking API calls**
  - Make use of concurrent API calls wherever possible

## UX Components and Colors

### Component Sources

UX components come from two primary sources:

- **oclif/core** - Provides basic components:
  - `ux.stdout` - Standard output
  - `ux.stderr` - Standard error
  - `ux.action.start` and `ux.action.stop` - Action spinners

- **heroku-cli-util (hux)** - Provides more involved components:
  - `hux.table` - Tabular data display
  - Themeable color system
  - Additional UX utilities
  - Repository: https://github.com/heroku/heroku-cli-util

### Commonly Used Components

Here is a list of commonly used ux components and when they are typically used:

- **ux.action.start and ux.action.stop**
  - Whenever data is changed (e.g., a POST, UPDATE, DELETE, etc.)
  - The request is expected to take longer than normal time (greater than, say, 600ms, as in when generating a report)

- **hux.confirm**
  - Destructive and irreversible actions
  - Important changes to a resource

- **hux.table**
  - The display of multiple instances of a resource (i.e., tabular data)

- **hux.styledObject and hux.styledJson**
  - The display of a singular instance of a resource

- **ux.error**
  - When an error condition occurs and we want to inform the user that the command failed with exit code 1

- **System notifications (heroku-cli/notifications)**
  - When some part of command execution could take a long time (e.g., greater than 20 seconds) to complete

- **Progress bar (cli-progress)**
  - When some action taking place has known progress values to display to the user (as in when downloading something)

### Colors

The CLI uses a themeable color system provided by heroku-cli-util. Colors should follow the organization and definitions described in:
- [heroku-cli-util Color System Documentation](https://github.com/heroku/heroku-cli-util/blob/main/docs/COLORS.md)

## Summary for AI Agents

When contributing code to this CLI:

1. ✅ Use lowercase-hyphenated names for commands and topics
2. ✅ Start command names with action verbs (create, add, destroy, remove, update)
3. ✅ Prefer flags over arguments; limit required parameters
4. ✅ Write clear, concise descriptions (fragments preferred, lowercase, no ending period)
5. ✅ Include examples using longform flags and `example-app` as the app name
6. ✅ Use appropriate ux components (ux.action for mutations, ux.table for lists, etc.)
7. ✅ Return non-zero exit codes on failures, zero on success
8. ✅ Keep validation logic thin; defer to the API
9. ✅ Use concurrent API calls to minimize blocking time
10. ✅ Pass through Platform API error messages to users
