require 'heroku/api/organizations_apps'

# Copy and paste hack of Apps for Dogwood. PROTOTYPE ONLY.
class Heroku::Command::Dapps < Heroku::Command::Base

  # dapps:info
  #
  # show detailed app information
  #
  # -s, --shell  # output more shell friendly key/value pairs
  #
  #Examples:
  #
  # $ heroku apps:info
  # === example
  # Git URL:   https://git.heroku.com/example.git
  # Repo Size: 5M
  # ...
  #
  # $ heroku apps:info --shell
  # git_url=https://git.heroku.com/example.git
  # repo_size=5000000
  # ...
  #
  def info
    validate_arguments!
    app_data = api.get_organization_app(app).body

    unless options[:shell]
      styled_header(app_data["name"])
    end

    addons_data = api.get_addons(app).body.map {|addon| addon['name']}.sort
    collaborators_data = api.get_collaborators(app).body.map {|collaborator| collaborator["email"]}.sort
    collaborators_data.reject! {|email| email == app_data["owner_email"]}

    if org? app_data['owner']['email']
      app_data['owner'] = app_owner(app_data['owner']['email'])
    end

    if options[:shell]
      app_data['git_url'] = git_url(app_data['name'])
      if app_data['domain_name']
        app_data['domain_name'] = app_data['domain_name']['domain']
      end
      unless addons_data.empty?
        app_data['addons'] = addons_data.join(',')
      end
      unless collaborators_data.empty?
        app_data['collaborators'] = collaborators_data.join(',')
      end
      app_data.keys.sort_by { |a| a.to_s }.each do |key|
        hputs("#{key}=#{app_data[key]}")
      end
    else
      data = {}

      unless addons_data.empty?
        data["Addons"] = addons_data
      end

      if app_data["archived_at"]
        data["Archived At"] = format_date(app_data["archived_at"])
      end

      data["Collaborators"] = collaborators_data

      if app_data["create_status"] && app_data["create_status"] != "complete"
        data["Create Status"] = app_data["create_status"]
      end

      if app_data["cron_finished_at"]
        data["Cron Finished At"] = format_date(app_data["cron_finished_at"])
      end

      if app_data["cron_next_run"]
        data["Cron Next Run"] = format_date(app_data["cron_next_run"])
      end

      if app_data["database_size"]
        data["Database Size"] = format_bytes(app_data["database_size"])
      end

      data["Git URL"] = git_url(app_data['name'])

      if app_data["database_tables"]
        data["Database Size"].gsub!('(empty)', '0K') + " in #{quantify("table", app_data["database_tables"])}"
      end

      if app_data["dyno_hours"].is_a?(Hash)
        data["Dyno Hours"] = app_data["dyno_hours"].keys.map do |type|
          "%s - %0.2f dyno-hours" % [ type.to_s.capitalize, app_data["dyno_hours"][type] ]
        end
      end

      data["Owner Email"] = app_data["owner_email"] if app_data["owner_email"]
      data["Owner"] = app_data["owner"] if app_data["owner"]
      data["Region"] = app_data["region"]["name"] if app_data["region"]
      data["Repo Size"] = format_bytes(app_data["repo_size"]) if app_data["repo_size"]
      data["Slug Size"] = format_bytes(app_data["slug_size"]) if app_data["slug_size"]
      data["Cache Size"] = format_bytes(app_data["cache_size"]) if app_data["cache_size"]

      data["Stack"] = app_data["stack"]["name"]
      data["Space"] = app_data["space"]["name"]
      if data["Stack"] != "cedar"
        data.merge!("Dynos" => app_data["dynos"], "Workers" => app_data["workers"])
      end

      data["Web URL"] = app_data["web_url"]

      styled_hash(data)
    end
  end

  # dapps:create [NAME]
  #
  # create a new app
  #
  #     --addons ADDONS        # a comma-delimited list of addons to install
  # -b, --buildpack BUILDPACK  # a buildpack url to use for this app
  # -n, --no-remote            # don't create a git remote
  # -r, --remote REMOTE        # the git remote to create, default "heroku"
  # -s, --stack STACK          # the stack on which to create the app
  #     --region REGION        # specify region for this app to run in
  #     --space SPACE          # specify space for this app to run in
  # -l, --locked               # lock the app
  #     --ssh-git              # Use SSH git protocol
  # -t, --tier TIER            # HIDDEN: the tier for this app
  #     --http-git             # HIDDEN: Use HTTP git protocol
  #
  #Examples:
  #
  # $ heroku apps:create
  # Creating floating-dragon-42... done, stack is cedar
  # http://floating-dragon-42.heroku.com/ | https://git.heroku.com/floating-dragon-42.git
  #
  # $ heroku apps:create -s bamboo
  # Creating floating-dragon-42... done, stack is bamboo-mri-1.9.2
  # http://floating-dragon-42.herokuapp.com/ | https://git.heroku.com/floating-dragon-42.git
  #
  # # specify a name
  # $ heroku apps:create example
  # Creating example... done, stack is cedar
  # http://example.heroku.com/ | https://git.heroku.com/example.git
  #
  # # create a staging app
  # $ heroku apps:create example-staging --remote staging
  #
  # # create an app in the eu region
  # $ heroku apps:create --region eu
  #
  def create
    name    = shift_argument || options[:app] || ENV['HEROKU_APP']
    validate_arguments!
    options[:ignore_no_org] = true

    params = {
      "name" => name,
      "region" => options[:region],
      "stack" => options[:stack],
      "locked" => options[:locked],
      "space" => options[:space],
      "organization" => options[:org]
    }.reject { |_,v| v.nil? }

    info = api.post_organization_app(params).body

    begin
      space_action = info['space'] ? " in space #{info['space']['name']}" : ''
      action("Creating #{info['name']}#{space_action}", :org => !!org) do
        if info['create_status'] == 'creating'
          Timeout::timeout(options[:timeout].to_i) do
            loop do
              break if api.get_app(info['name']).body['create_status'] == 'complete'
              sleep 1
            end
          end
        end
        if options[:region]
          status("region is #{region_from_app(info)}")
        else
          stack = (info['stack'].is_a?(Hash) ? info['stack']["name"] : info['stack'])
          status("stack is #{stack}")
        end
      end

      (options[:addons] || "").split(",").each do |addon|
        addon.strip!
        action("Adding #{addon} to #{info["name"]}") do
          api.post_addon(info["name"], addon)
        end
      end

      if buildpack = options[:buildpack]
        api.put_config_vars(info["name"], "BUILDPACK_URL" => buildpack)
        display("BUILDPACK_URL=#{buildpack}")
      end

      hputs([ info["web_url"], git_url(info['name']) ].join(" | "))
    rescue Timeout::Error
      hputs("Timed Out! Run `heroku status` to check for known platform issues.")
    end

    unless options[:no_remote].is_a? FalseClass
      create_git_remote(options[:remote] || "heroku", git_url(info['name']))
    end
  end
end
