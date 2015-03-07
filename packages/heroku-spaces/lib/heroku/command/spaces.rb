require 'heroku/api/spaces'
Excon.defaults[:ssl_verify_peer] = false
class Heroku::Command::Spaces < Heroku::Command::Base

  # spaces
  #
  # lists available spaces
  #
  def index
    validate_arguments!

    @spaces = api.get_spaces().body

    if @spaces.empty?
      display('You do not have access to any spaces.')
      return
    end

    display_header 'Spaces'
    cols = %w(Name Organization State)
    display_table(@spaces.map{|s| for_display(s)}, cols, cols)
  end

  # spaces:info
  #
  # show info about a space
  #
  # --space SPACE   # name of space
  #
  def info
    require_argument! :space
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
    require_argument! :org
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
    require_argument! :space
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
    require_argument! :space
    validate_arguments!

    return unless confirm
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

  def require_argument!(arg)
    return if options.key?(arg)
    output_with_bang("An argument for \"--#{arg.to_s }\" must be provided.")
    Heroku::Command.run(current_command, ['--help'])
    exit(1)
  end

  def for_display(space)
    {
      'Name' => space['name'],
      'Organization' => space['organization']['name'],
      'State' => space['state']
    }
  end

  def style(space)
    styled_header(space['name'])
    styled_hash(for_display(space), ['Organization', 'State'])
  end
end
