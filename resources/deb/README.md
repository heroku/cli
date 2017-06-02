Installing the Heroku CLI on Ubuntu/Debian
==========================================

Add Heroku repository to apt:

    sudo add-apt-repository "deb https://cli-assets.heroku.com/branches/stable/apt ./"

Install Heroku's release key for package verification:

    curl -L https://cli-assets.heroku.com/apt/release.key | sudo apt-key add -

Install the CLI:

    sudo apt-get update
    sudo apt-get install heroku
