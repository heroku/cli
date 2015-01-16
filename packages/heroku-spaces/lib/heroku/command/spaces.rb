require 'heroku/api/spaces'
Excon.defaults[:ssl_verify_peer] = false
class Heroku::Command::Spaces < Heroku::Command::Base

  # spaces:info
  #
  # show info about a space
  #
  # --space SPACE   # name of space
  #
  def info
    validate_arguments!

    space = api.get_space(options[:space]).body
    style space
  end

  # spaces:create NAME
  #
  # create a new space
  #
  # -o --org ORGANIZATION
  #
  def create
    name = extract_name_arg!
    validate_arguments!

    action("Creating space #{name} in organization #{options[:org]}") do
      @space = api.post_space(name: name, organization: options[:org]).body
    end
    style @space
  end

  # spaces:rename
  #
  # rename a space
  #
  # --space SPACE   # current name of space
  #
  def rename
    name = extract_name_arg!
    validate_arguments!

    action("Renaming space #{options[:space]} to #{name}") do
      @space = api.patch_space(options[:space], name: name).body
    end
    style @space
  end


  # spaces:destroy
  #
  # destroy a space
  #
  # --space SPACE   # name of space
  #
  def destroy
    validate_arguments!

    action("Destroying space #{options[:space]}") do
      @space = api.delete_space(options[:space]).body
    end
    style @space
  end

  private

  def extract_name_arg!
    name = shift_argument
    if name.nil?
      Heroku::Command.run(current_command, ['--help'])
      exit(1)
    end
    name
  end

  def style(space)
    styled_header space['name']
    details = {
      'Owner' => space['organization']['name'],
      'State' => space['state']
    }
    styled_hash(details)
  end
end
