#!/bin/sh
{
	set -e

	channel=stable
	while getopts ":c:du" opt; do
		case ${opt} in
			d )
				debug=1
				;;
			c )
				channel="$OPTARG"
				;;
			u )
				uninstall=1
				;;
			\? )
				echo "Usage: wget -qO- https://cli-assets.heroku.com/install-ubuntu.sh | sh -s -- [flags]"
				echo "    -c [CHANNEL]    Channel to use (stable/beta). Defaults to stable."
				echo "    -d              Debug mode"
				echo "    -u              Uninstall instead"
				exit 0
				;;
			: )
				echo "Invalid option: $OPTARG requires an argument" 1>&2
				;;
		esac
	done

	SUDO=''
	if [ "$(id -u)" != "0" ]; then
		SUDO='sudo'
		echo "This script requires superuser access to install apt packages."
		echo "You will be prompted for your password by sudo."
		# clear any previous sudo permission
		sudo -k
	fi

	if [ -n "$uninstall" ]; then
		$SUDO sh <<-SCRIPT
				set -e
				if [ -n "$debug" ]; then
					set -x
				fi
				rm -f /etc/apt/sources.list.d/heroku.list
				apt-get remove -y heroku-toolbelt heroku || true
				apt-key del 0F1B0520
				apt-get purge
			SCRIPT
			exit
		fi

		# run inside sudo
		$SUDO sh <<-SCRIPT
			set -e
			if [ -n "$debug" ]; then
				set -x
			fi

			echo "$channel"
			# if apt-transport-https is not installed, clear out old sources, update, then install apt-transport-https
			dpkg -s apt-transport-https 1>/dev/null 2>/dev/null || \
				(echo "adding apt-transport-https..." \
					&& echo "" > /etc/apt/sources.list.d/heroku.list \
					&& apt-get update \
					&& apt-get install -y apt-transport-https)

			echo "adding heroku repository to apt..."
			echo "deb https://cli-assets.heroku.com/branches/$channel/apt ./" > /etc/apt/sources.list.d/heroku.list

			# remove toolbelt
			(dpkg -s heroku-toolbelt 1>/dev/null 2>/dev/null && \
				(echo "removing heroku-toolbelt..." && apt-get remove -y heroku-toolbelt heroku || true)) || true

			echo "adding release gpg key..."
			wget -qO- https://cli-assets.heroku.com/apt/release.key | apt-key add -

			echo "apt-get update..."
			apt-get update

			echo "apt-get install heroku..."
			apt-get install -y heroku

		SCRIPT
# test the CLI
LOCATION=$(which heroku)
echo "heroku cli installed to $LOCATION"
echo "checking installed CLI version..."
heroku version
}
