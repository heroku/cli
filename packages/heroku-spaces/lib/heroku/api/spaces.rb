require_relative 'v3_dogwood'

module Heroku
  class API
    def get_spaces
      request(
        :method => :get,
        :expects => [200, 206],
        :headers  => ACCEPT_V3_DOGWOOD,
        :path => "/spaces"
      )
    end

    def post_space(body)
      request(
        :method => :post,
        :body => MultiJson.dump(body),
        :expects => [201],
        :headers  => ACCEPT_V3_DOGWOOD,
        :path => "/spaces"
      )
    end

    def get_space(space_identity)
      request(
        :method => :get,
        :expects => [200],
        :headers  => ACCEPT_V3_DOGWOOD,
        :path => "/spaces/#{space_identity}"
      )
    end

    def patch_space(space_identity, body)
      request(
        :method => :patch,
        :body => MultiJson.dump(body),
        :expects => [200],
        :headers  => ACCEPT_V3_DOGWOOD,
        :path => "/spaces/#{space_identity}"
      )
    end

    def delete_space(space_identity)
      request(
        :method => :delete,
        :expects => [200],
        :headers  => ACCEPT_V3_DOGWOOD,
        :path => "/spaces/#{space_identity}"
      )
    end
  end
end
