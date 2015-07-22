# DEPRECATED PROTOTYPE
class Heroku::Command::Dapps < Heroku::Command::Base

  # dapps:info
  #
  # DEPRECATED: Use `heroku info`
  #
  def info
    error 'DEPRECATED: Use `heroku apps:info`'
  end

  # dapps:create
  #
  # DEPRECATED: Use `heroku create --space SPACE`
  #
  def create
    error 'DEPRECATED: Use `heroku create --space SPACE`'
  end
end
