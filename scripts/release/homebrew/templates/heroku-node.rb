# This file is automatically generated by https://github.com/heroku/cli/blob/main/scripts/release/homebrew.js
# Do not update this file directly;
# Please update the template instead:
# https://github.com/heroku/cli/blob/main/scripts/release/homebrew/templates/heroku-node.rb
class HerokuNode < Formula
  desc "node.js dependency for heroku"
  homepage "https://cli.heroku.com"
  url "__NODE_BIN_URL__"
  version "__NODE_VERSION__"
  sha256 "__NODE_SHA256__"
  keg_only "heroku-node is only used by Heroku CLI (heroku/brew/heroku), which explicitly requires from Cellar"

  def install
    bin.install buildpath/"bin/node"
  end

  def test
    output = system bin/"node", "version"
    assert output.strip == "v#{version}"
  end
end
