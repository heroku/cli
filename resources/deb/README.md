Installing the SFDX CLI on Ubuntu/Debian
==========================================

Add SFDX repository to apt:

    sudo add-apt-repository "deb https://cli-assets.heroku.com/branches/sfdx/apt ./"

Install SFDX's release key for package verification:

    curl -L https://cli-assets.heroku.com/apt/release.key | sudo apt-key add -

Install the CLI:

    sudo apt-get update
    sudo apt-get install sfdx
