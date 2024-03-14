#compdef heroku

_heroku () {
  # exit if vars are not set
  : "${HEROKU_AC_ANALYTICS_DIR?}"
  : "${HEROKU_AC_COMMANDS_PATH?}"

  local -a _flags=()
  local _command_id=${words[2]}
  local _cur=${words[CURRENT]}

  mkdir -p "$HEROKU_AC_ANALYTICS_DIR"

  ## all commands
  _complete_commands () {
   touch "$HEROKU_AC_ANALYTICS_DIR"/command
   local -a _all_commands_list
   if type _set_all_commands_list >/dev/null 2>&1; then
     _set_all_commands_list
     _describe -t all-commands "all commands" _all_commands_list
     return
   fi
   # fallback to grep'ing cmds from cache
   compadd $(grep -oe '^[a-zA-Z0-9:_-]\+' $HEROKU_AC_COMMANDS_PATH)
  }
  ## end all commands

  _compadd_args () {
    compadd $(echo $([[ -n $REPORTTIME ]] && REPORTTIME=100; heroku autocomplete:options "${words}"))
  }

  _compadd_flag_options () {
    touch "$HEROKU_AC_ANALYTICS_DIR"/value
    _compadd_args
  }

  if [ $CURRENT -gt 2 ]; then
    if [[ "$_cur" == -* ]]; then
      touch "$HEROKU_AC_ANALYTICS_DIR"/flag
      local _flag_completion_func="_set_${_command_id//:/_}_flags"
      declare -f $_flag_completion_func >/dev/null && $_flag_completion_func
    else
      if type _compadd_args >/dev/null 2>&1; then
        _compadd_args
      fi
    fi
  fi

  _arguments  '1: :_complete_commands' \
              $_flags
}

_heroku
