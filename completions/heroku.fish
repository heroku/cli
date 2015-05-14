function __heroku_command_completion
  heroku commands
end

complete -c heroku -n '__fish_is_token_n 2' --arguments '(__heroku_command_completion)' --no-files
