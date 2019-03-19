const _ = require('lodash');
const path = require('path');
const cp = require('child_process');

module.exports.command = 'build';
module.exports.desc = "[convenience method] Run the command defined in 'configuration.build'";
module.exports.builder = {
  configuration: {
    alias: 'c',
    describe:
      "Select a device configuration from your defined configurations, if not supplied, and there's only one configuration, detox will default to it"
  }
};

module.exports.handler = function(argv) {
  const config = require(path.join(process.cwd(), 'package.json')).detox;

  if (!config) {
    throw new Error('Cannot find detox section in package.json');
  }

  if (!config.configurations) {
    throw new Error('Cannot find detox.configurations in package.json');
  }

  const configurationSelection = argv.configuration || (_.size(config.configurations) === 1 ? _.keys(config.configurations)[0] : '');
  if (!configurationSelection) {
    throw new Error(`Cannot determine which configuration to use. use --configuration to choose one of the following: 
    ${Object.keys(config.configurations)}`);
  }

  const buildSearchPath = `configurations["${configurationSelection}"].build`;
  const buildScript = _.result(config, buildSearchPath);

  if (buildScript) {
    console.log(buildScript);
    cp.execSync(buildScript, { stdio: 'inherit' });
  } else {
    throw new Error(`Could not find build script in detox.${buildSearchPath}`);
  }
};
