'use strict';

module.exports = {
    services: {
        "heroku-postgresql": {
            "created_at":"2013-10-24T17:21:05Z",
            "default":true,
            "description":"Heroku Postgres Hobby Dev",
            "human_name":"Hobby Dev",
            "id":"062a1cc7-f79f-404c-9f91-135f70175577",
            "name":"heroku-postgresql:hobby-dev",
            "price":{
                "cents":0,
                "unit":"month"
            },
            "state":"ga",
            "updated_at":"2014-06-18T17:06:29Z"
        },

        "heroku-redis": {
            "cli_plugin_name":"heroku-redis",
            "created_at":"2014-09-30T21:45:10Z",
            "human_name":"Heroku Redis",
            "id":"5bbf672c-07f6-49c2-9c16-f1dcb96784db",
            "name":"heroku-redis",
            "state":"ga",
            "supports_multiple_installations":true,
            "supports_sharing":true,
            "updated_at":"2015-08-27T06:42:14Z"
        }
    },
    plans: {
        "heroku-postgresql:hobby-dev": {
            "created_at":"2013-10-24T17:21:05Z",
            "default":true,
            "description":"Heroku Postgres Hobby Dev",
            "human_name":"Hobby Dev",
            "id":"062a1cc7-f79f-404c-9f91-135f70175577",
            "name":"heroku-postgresql:hobby-dev",
            "price":{
                "cents":0,
                "unit":"month"
            },
            "state":"ga",
            "updated_at":"2014-06-18T17:06:29Z"
        },
        "heroku-redis:premium-2": {
            "created_at":"2015-06-23T19:03:06Z",
            "default":false,
            "description":"Heroku Redis Premium 2",
            "human_name":"Premium 2",
            "id":"b20bdaae-137f-4c39-9b51-e7b19b0ab5ff",
            "name":"heroku-redis:premium-2",
            "price":{
                "cents":6000,
                "unit":"month"
            },
            "state":"ga",
            "updated_at":"2015-06-25T16:10:02Z"
        },
    }
}
