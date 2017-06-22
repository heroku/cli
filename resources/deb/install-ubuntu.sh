#!/bin/sh
{
    set -ex
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
  apt-get update
  export APT_TRANSPORT_MISSING=$(dpkg -l apt-transport-https | grep -c 'no packages')
  if [ $APT_TRANSPORT_MISSING == '1' ]; then
    apt-get install apt-transport-https
  fi

  # add heroku repository to apt
  echo "deb https://cli-assets.heroku.com/branches/stable/apt ./" > /etc/apt/sources.list.d/heroku.list

  # remove toolbelt
  apt-get remove -y heroku-toolbelt heroku || true

  # install heroku's release key for package verification
  wget -qO- https://cli-assets.heroku.com/apt/release.key | apt-key add -

  # update your sources
  apt-get update

  # install the toolbelt
  apt-get install -y heroku

SCRIPT
}
