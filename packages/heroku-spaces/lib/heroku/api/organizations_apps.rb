require_relative 'v3'

module Heroku
  class API
    def post_organization_app(body)
      request(
        :method => :post,
        :body => MultiJson.dump(body),
        :expects => [201],
        :headers => ACCEPT_V3,
        :path => "/organizations/apps"
      )
    end

    def get_organization_app(app_identity)
      request(
        :method => :get,
        :expects => [200],
        :headers => ACCEPT_V3,
        :path => "/organizations/apps/#{app_identity}"
      )
    end
  end
end
