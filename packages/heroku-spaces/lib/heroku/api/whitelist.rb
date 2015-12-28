require_relative 'v3'

module Heroku
  class API
    def get_whitelist(space_identity)
      request(
        :method => :get,
        :expects => [200],
        :headers => ACCEPT_V3_DOGWOOD,
        :path => "/spaces/#{space_identity}/inbound-ruleset"
      )
    end

    def put_whitelist(space_identity, whitelist)
      request(
        :method => :put,
        :body => MultiJson.dump(whitelist),
        :expects => [200],
        :headers => ACCEPT_V3_DOGWOOD,
        :path => "/spaces/#{space_identity}/inbound-ruleset"
      )
    end
  end
end
