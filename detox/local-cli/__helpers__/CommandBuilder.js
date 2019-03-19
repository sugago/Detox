const fs = require('fs');
const path = require('path');
const yargs = require('yargs');

class CommandBuilder {
  constructor() {
    this._cwd = process.cwd();
    this._env = {...process.env};
    this._json = {};
    this._command = '';
    this._args = '';
  }

  static init() {
    return new CommandBuilder();
  }

  withCwd(cwd) {
    this._cwd = cwd;
    return this;
  }

  withPackageJson(json) {
    if (json.hasOwnProperty('detox')) {
      this._json = json;
    } else {
      this._json = { detox: json };
    }

    return this;
  }

  withEnv(env, overwrite = false) {
    if (overwrite) {
      this._env = env;
    } else {
      Object.assign(this._env, env);
    }

    return this;
  }

  withCommand(command) {
    this._command = command;
    return this;
  }

  withArgs(args) {
    this._args = args;
    return this;
  }

  async exec() {
    const originalEnv = process.env;

    try {
      this._mockFs();
      this._mockJson();
      process.env = this._env;

      const parsed = await this._parseCommand();
      return parsed;
    } finally {
      process.env = originalEnv;
      this._unmockJson();
    }
  }

  _mockFs() {
    const originalFn = fs.readFileSync;
    const self = this;

    fs.readFileSync = jest.fn((function () {
      if (arguments[0] === self._getProjectPackageJsonPath()) {
        return JSON.stringify(self._json, null, 4);
      }

      return originalFn.apply(this, arguments);
    }).bind(this));
  }

  _mockJson() {
    jest.mock(this._getProjectPackageJsonPath(), () => this._json);
  }

  _unmockJson() {
    jest.unmock(this._getProjectPackageJsonPath());
  }

  _getProjectPackageJsonPath() {
    return path.join(this._cwd, 'package.json');
  }

  _getPathToCommandFile() {
    return path.join(__dirname, "..", this._command);
  }

  _parseCommand() {
    this.parser = yargs
      .scriptName('detox')
      .env('DETOX')
      .pkgConf('detox')
      .command(require(this._getPathToCommandFile()))
      .help();

    return new Promise((resolve, reject) => {
      try {
        this.parser.parse(`${this._command} ${this._args}`, (err, argv, output) => {
          return err ? reject(err) : resolve(output);
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = CommandBuilder;
