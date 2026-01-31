#!/usr/bin/env bash

if ! type __ltrim_colon_completions >/dev/null 2>&1; then
  #   Copyright © 2006-2008, Ian Macdonald <ian@caliban.org>
  #             © 2009-2017, Bash Completion Maintainers
  __ltrim_colon_completions() {
      # If word-to-complete contains a colon,
      # and bash-version < 4,
      # or bash-version >= 4 and COMP_WORDBREAKS contains a colon
      if [[
          "$1" == *:* && (
              ${BASH_VERSINFO[0]} -lt 4 ||
              (${BASH_VERSINFO[0]} -ge 4 && "$COMP_WORDBREAKS" == *:*)
          )
      ]]; then
          # Remove colon-word prefix from COMPREPLY items
          local colon_word=${1%${1##*:}}
          local i=${#COMPREPLY[*]}
          while [ $((--i)) -ge 0 ]; do
              COMPREPLY[$i]=${COMPREPLY[$i]#"$colon_word"}
          done
      fi
  }
fi

_compreply_cli () {
  opts=("$(heroku autocomplete:options "$(echo "${COMP_WORDS[*]}")")")
  COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
}

_heroku()
{
    # print error and exit if vars are not set
    : "${HEROKU_AC_ANALYTICS_DIR?}"
    : "${HEROKU_AC_COMMANDS_PATH?}"

    local cur="${COMP_WORDS[COMP_CWORD]}" opts IFS=$' \t\n'
    COMPREPLY=()
    mkdir -p "$HEROKU_AC_ANALYTICS_DIR"

    if [[ "${COMP_CWORD}" -eq 1 ]] ; then
        touch "$HEROKU_AC_ANALYTICS_DIR"/command
        opts=$(grep -oe '^[a-zA-Z0-9:_-]\+' $HEROKU_AC_COMMANDS_PATH)
        COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
         __ltrim_colon_completions "$cur"
    else
        if [[ $cur == "-"* ]] ; then
          touch "$HEROKU_AC_ANALYTICS_DIR"/flag
          opts=$(grep "${COMP_WORDS[1]}" $HEROKU_AC_COMMANDS_PATH | sed -n "s/^${COMP_WORDS[1]} //p")
          COMPREPLY=( $(compgen -W  "${opts}" -- ${cur}) )
        else
          touch "$HEROKU_AC_ANALYTICS_DIR"/value
          _compreply_cli
        fi
    fi
    return 0
}

complete -F _heroku heroku
