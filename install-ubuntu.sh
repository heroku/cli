#!/bin/sh
{
    set -e
    SUDO=''
    if [ "$(id -u)" != "0" ]; then
      SUDO='sudo'
      echo "This script requires superuser access to install apt packages."
      echo "You will be prompted for your password by sudo."
      # clear any previous sudo permission
      sudo -k
    fi

    # run inside sudo
    $SUDO sh <<SCRIPT
  set -ex

  # if apt-transport-https is not installed, clear out old sources, update, then install apt-transport-https
  dpkg -s apt-transport-https 1>/dev/null 2>/dev/null || \
    (echo "" > /etc/apt/sources.list.d/heroku.list \
      && apt-get update \
      && apt-get install -y apt-transport-https)

  # Download Heroku's release key
  curl -fsS https://cli-assets.heroku.com/channels/stable/apt/release.key -o /tmp/heroku-archive-keyring.asc

  # Use apt-key if available, otherwise use keyring method
  if command -v apt-key 1>/dev/null 2>&1; then
    echo "deb https://cli-assets.heroku.com/channels/stable/apt ./" > /etc/apt/sources.list.d/heroku.list
    cat /tmp/heroku-archive-keyring.asc | apt-key add -
  else
    dpkg -s gpg 1>/dev/null 2>/dev/null || apt-get install -y gpg

    mkdir -p /etc/apt/keyrings

    # We use the --dearmor flag to convert the ASCII key to GPG format. 
    # This is necessary because we need to point `signed-by` (in the apt sources 
    # list) to a GPG formatted key.
    gpg --dearmor < /tmp/heroku-archive-keyring.asc > /etc/apt/keyrings/heroku-archive-keyring.gpg
    echo "deb [signed-by=/etc/apt/keyrings/heroku-archive-keyring.gpg] https://cli-assets.heroku.com/channels/stable/apt ./" > /etc/apt/sources.list.d/heroku.list
  fi

  rm -f /tmp/heroku-archive-keyring.asc

  # remove toolbelt
  (dpkg -s heroku-toolbelt 1>/dev/null 2>/dev/null && (apt-get remove -y heroku-toolbelt heroku || true)) || true

  # update your sources
  apt-get update

  # install the toolbelt
  apt-get install -y heroku

SCRIPT
  # test the CLI
  LOCATION=$(which heroku)
  echo "heroku installed to $LOCATION"
  heroku version
}
