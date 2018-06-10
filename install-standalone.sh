#!/bin/bash
{
    set -e
    SUDO=''
    if [ "$(id -u)" != "0" ]; then
      SUDO='sudo'
      echo "This script requires superuser access."
      echo "You will be prompted for your password by sudo."
      # clear any previous sudo permission
      sudo -k
    fi


    # run inside sudo
    $SUDO bash <<SCRIPT
  set -ex

  echoerr() { echo "\$@" 1>&2; }

  if [[ ! ":\$PATH:" == *":/usr/local/bin:"* ]]; then
    echoerr "Your path is missing /usr/local/bin, you need to add this to use this installer."
    exit 1
  fi

  if [ "\$(uname)" == "Darwin" ]; then
    OS=darwin
  elif [ "\$(expr substr \$(uname -s) 1 5)" == "Linux" ]; then
    OS=linux
  else
    echoerr "This installer is only supported on Linux and MacOS"
    exit 1
  fi

  ARCH="\$(uname -m)"
  if [ "\$ARCH" == "x86_64" ]; then
    ARCH=x64
  elif [[ "\$ARCH" == arm* ]]; then
    ARCH=arm
  else
    echoerr "unsupported arch: \$ARCH"
    exit 1
  fi

  mkdir -p /usr/local/lib
  cd /usr/local/lib
  rm -rf heroku
  rm -rf ~/.local/share/heroku/client
  curl https://cli-assets.heroku.com/heroku-\$OS-\$ARCH.tar.xz | tar xJ
  if [ $(which heroku) != /usr/local/bin/heroku ]; then
    # delete incorrect heroku path
    rm -f $(which heroku)
  fi
  rm -f /usr/local/bin/heroku
  ln -s /usr/local/lib/heroku/bin/heroku /usr/local/bin/heroku

SCRIPT
  # test the CLI
  LOCATION=$(which heroku)
  echo "heroku installed to $LOCATION"
  heroku version
}
