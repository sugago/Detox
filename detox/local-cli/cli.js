#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

yargs
  .scriptName('detox')
  .env('DETOX')
  .pkgConf('detox')
  .default("config", path.join(process.cwd(), '.detoxrc'))
  .config('config', 'configuration either as JSON or as Javascript file', function(configPath) {
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {
        return require(configPath);
      }
    }
  })
  .commandDir('./', {
    exclude: function(path) {
      // This is a test file
      if (/\.test\.js$/.test(path)) {
        return true;
      }
      return false;
    }
  })
  .demandCommand()
  .recommendCommands()
  .help()
  .wrap(yargs.terminalWidth() * 0.9).argv;
