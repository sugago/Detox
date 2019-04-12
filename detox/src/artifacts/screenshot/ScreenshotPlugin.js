const argparse = require('../../utils/argparse');
const SnapshotPlugin = require('../templates/plugin/SnapshotPlugin');

/***
 * @abstract
 */
class ScreenshotPlugin extends SnapshotPlugin {
  constructor(config) {
    super(config);

    const takeScreenshots = argparse.getArgValue('take-screenshots');

    this.enabled = Boolean(takeScreenshots && takeScreenshots !== 'none');
    this.automatic = takeScreenshots !== 'manual';
    this.keepOnlyFailedTestsArtifacts = takeScreenshots === 'failing';
  }

  async onBeforeEach(testSummary) {
    await super.onBeforeEach(testSummary);

    if (this._shouldTakeAutomaticScreenshot()) {
      await this.takeSnapshot('beforeEach');
    }
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    if (this._shouldTakeAutomaticScreenshot()) {
      await this.takeSnapshot('afterEach');
    }

    this.flushSnapshots();
  }

  _shouldTakeAutomaticScreenshot() {
    const {testSummary} = this.context;
    return this.enabled && this.automatic && this.shouldKeepArtifactOfTest(testSummary);
  }

  async preparePathForSnapshot(testSummary, name) {
    return this.api.preparePathForArtifact(`${name}.png`, testSummary);
  }

  async onUserAction({ type, options }) {
    if (!this.enabled) {
      return;
    }

    if (type === 'takeScreenshot') {
      await this.takeSnapshot(options.name);
    }
  }
}

module.exports = ScreenshotPlugin;
