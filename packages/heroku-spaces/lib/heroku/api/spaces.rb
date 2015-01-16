module Heroku
  class API
    ACCEPT_V3_DOGWOOD = { 'Accept' => 'application/vnd.heroku+json; version=3.dogwood'}

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
