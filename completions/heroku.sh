#!/usr/bin/env bash

# Bash completion script for Heroku CLI

function _heroku_completion() {

    local cur prev opts

    COMPREPLY=()

    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"

    case "${prev}" in
        --app|-a|--from)
            opts=$(heroku apps | grep -E "^(\w|\d|\-)+$")
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        --remote|-r)
            opts=$([[ -d .git ]] && git remote)
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        -p|--policy)
            opts="allkeys-lru volatile-lru allkeys-random volatile-random volatile-ttl"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        features:disable|features:enable|ps:*)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        access:add|access:update)
            opts="-a --app -r --remote --permissions"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        access|domains|domains:*|drains|drains:*|features|features:*|labs|labs:*|ps)
            opts="-a --app -r --remote --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        addons|addons:*)
            opts="-A --all -a --app -r --remote --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:create)
            opts="--remote --region --buildpack"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:destroy|apps:info)
            opts=$(heroku apps | grep -E "^(\w|\d|\-)+$")
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:errors|apps:favorites:*)
            opts="-a --app -r --remote --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:fork)
            opts="--confirm --from --region --skip-pg --to"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        access:remove|apps:join|apps:lock|apps:open|apps:stacks*|drains:add|drains:remove|dyno:*)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:rename)
            opts="-a --app -r --remote --ssh-git"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps:transfer)
            opts="-a --app -r --remote -l --locked --bulk"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        apps|apps:*)
            opts="-A --all -o --org -p --personal -s --space --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        authorizations:create)
            opts="-d --description -e --expires-in -s --scope --short"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        authorizations:update)
            opts="-d --description --client-id --client-secret"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        authorizations|authorizations:*|clients|clients:*|commands|pipelines|pipelines:*|sessions|sessions:*|status|teams)
            opts="--json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        buildpacks:add|buildpacks:remove:buildpacks:set)
            opts="-a --app -r --remote -i --index"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        certs:add|certs:update)
            opts="-a --app -r --remote --bypass --domains --type"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        certs:generate)
            opts="-a --app -r --remote --area --city --country --keysize --now --owner --selfsigned --subject"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        certs:info|certs:remove|certs:rollback)
            opts="-a --app -r --remote --endpoint --name"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        clients:create)
            opts="-s --shell"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        clients:info)
            opts="-s --shell --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        clients:update)
            opts="-n --name --url"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        config)
            opts="-a --app -r --remote --json -s --shell"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        config:get)
            opts="-a --app -r --remote -s --shell"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        domains|drains)
            opts="-a --app -r --remote --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        domains:add)
            opts="-a --app -r --remote --wait"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        drains)
            opts=$(heroku apps | grep -E "^(\w|\d|\-)+$")
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        git:*)
            opts="-a --app -r --remote --ssh-git"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        heroku)
            opts=$(heroku commands)
            COMPREPLY=( $(compgen -W "${opts} help" -- ${cur}) )
            return 0
            ;;
        help)
            opts=$(heroku commands)
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        buildpacks|buildpacks:clear|certs|certs:*|config:set|config:unset|domains:clear|domains:remove|join|maintenance|maintenance:*|pg|pg:*|redis|redis:*)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        keys:add)
            opts="-y --yes"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        keys:add|keys:remove)
            opts=""
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        keys|keys:*)
            opts="-l --long --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        local|local:*)
            opts="-e --env -p --port -f --procfile"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        logs)
            opts="-a --app -d --dyno -n --num -r --remote -s --source -t --tail --force-colors"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        local:run)
            opts="-e --env -p --port -f"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        local|local:*)
            opts="-e --env -p --port -f --procfile"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        lock)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        members:add|members:set)
            opts="-o --org -r --role -t --team"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        members:remove)
            opts="-o --org -t --team"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        members|members:*)
            opts="-o --org -r --role -t --team --json --pending"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        notifications|notifications:*)
            opts="-A --all -a --app -r --remote --json --read"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        orgs:open)
            opts="-o --org"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        orgs|orgs:*)
            opts="--enterprise --teams --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:capture)
            opts="-a --app -r --remote -v --verbose --wait-interval"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:delete|pg:backups:download|pg:links:destroy|pg:reset|pg:unfollow|pg:upgrade|redis:cli)
            opts="-a --app -c --confirm -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:restore|pg:copy)
            opts="-a --app -c --confirm -r --remote -v --verbose --wait-interval"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:schedule)
            opts="-a --app -r --remote --at"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:credentials|redis:credentials)
            opts="-a --app -r --remote --reset"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:kill|pg:maintenance:run)
            opts="-a --app -r --remote --force"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:links:create)
            opts="-a --app -r --remote --as"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:ps)
            opts="-a --app -r --remote -v --verbose"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:backups:psql)
            opts="-a --app -r --remote -c --command"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pg:wait)
            opts="-a --app -r --remote --wait-interval"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pipelines:add|pipelines:create|pipelines:update)
            opts="-a --app -r --remote -s --stage"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pipelines:destroy|pipelines:open|pipelines:rename)
            opts=""
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pipelines:diff|pipelines:remove)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pipelines:promote)
            opts="-a --app -r --remote -t --to"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        pipelines:setup)
            opts="-o --organisation -t --team -y --yes"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        redis:maintenance)
            opts="-a --app -f --force -r --remote -w --window"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        redis:maxmemory)
            opts="-a --app -p --policy -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        redis:timeout)
            opts="-a --app -r --remote -s --seconds"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        regions)
            opts="--common --private --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        releases:shell|releases:info)
            opts="-a --app -r --remote --json -s --shell"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        releases:output|releases:rollback)
            opts="-a --app -r --remote"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        releases)
            opts="-a --app -n --num -r --remote --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        run)
            opts="-a --app -e --env -x --exit-code -r --remote -s --size --no-tty"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        run:detached)
            opts="-a --app -e --env -r --remote -s --size -t --tail"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:create)
            opts="-o --org --json --region"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:destroy|spaces:vpn:destroy)
            opts="-s --space --confirm"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:info|spaces:peering:info|spaces:peerings|spaces:ps|spaces:topology|spaces:vpn:info)
            opts="-s --space --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:peerings:accept)
            opts="-s --space -p --pcxid"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:peerings:destroy)
            opts="-s --space -p --pcxid --confirm"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:rename)
            opts="--from --to"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:vpn:config)
            opts="-s --space"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:vpn:create)
            opts="-c --cidrs -i --ip -s --space"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces:vpn:wait)
            opts="-i --interval -s --space -t --timeout --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        spaces|spaces:*)
            opts="-o --org --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        trusted-ips:add|trusted-ips:remove)
            opts="--confirm --space"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;

        trusted-ips)
            opts="-s --space --json"
            COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
            return 0
            ;;
        *)
            ;;
    esac

}
complete -F _heroku_completion heroku
