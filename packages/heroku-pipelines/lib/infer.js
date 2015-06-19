'use strict';

module.exports = function infer(app) {
  // Set defaults
  let basename = app;
  let stage = "production";

  let pattern = /-[a-z]+$/;
  let match = pattern.exec(app);
  if(match) {
    switch (match[0]) {
      case "-dev":
      case "-development":
        basename = app.replace(pattern,"");
        stage = "development";
        break;
      case "-uat":
      case "-tst":
      case "-test":
        basename = app.replace(pattern,"");
        stage = "test";
        break;
      case "-qa":
        basename = app.replace(pattern,"");
        stage = "qa";
        break;
      case "-stg":
      case "-staging":
        basename = app.replace(pattern,"");
        stage = "staging";
        break;
      case "-admin":
      case "-demo":
      case "-prod":
      case "-production":
        basename = app.replace(pattern,"");
        stage = "production";
        break;
      default:
        basename = app;
        stage = "production";
    }
  }
  pattern = /-pr-(\d+)$/;
  if (pattern.test(app)) {
    basename = app.replace(pattern,"");
    stage = "review";
  }
  return [basename,stage];
};
