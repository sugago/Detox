const WholeTestRecorderPlugin = require('./WholeTestRecorderPlugin');

/***
 * @abstract
 */
class StartupAndTestRecorderPlugin extends WholeTestRecorderPlugin {
  constructor({ api }) {
    super({ api });

    this.startupRecording = null;
    this._isRecordingStartup = false;
  }

  /***
   * @protected
   */
  get currentRecording() {
    return this._isRecordingStartup
      ? this.startupRecording
      : this.testRecording;
  }

  async onBeforeAll() {
    await super.onBeforeAll();

    if (this.enabled) {
      const recording = this.createStartupRecording();
      await recording.start();

      this.startupRecording = recording;
      this.api.trackArtifact(recording);
      this._isRecordingStartup = true;
    }
  }

  async onBeforeEach(testSummary) {
    if (this._isRecordingStartup) {
      await this.startupRecording.stop();
      this._isRecordingStartup = false;
    }

    await super.onBeforeEach(testSummary);
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);
    this._finalizeStartupRecording();
  }

  async onAfterAll() {
    await super.onAfterAll();
    this._finalizeStartupRecording();
  }

  /***
   * @abstract
   * @protected
   */
  createStartupRecording() {}

  /***
   * @abstract
   * @protected
   */
  async preparePathForStartupArtifact() {}

  _finalizeStartupRecording() {
    if (!this.startupRecording) {
      return;
    }

    switch (this.shouldKeepArtifactsOfTestSession()) {
      case true: return this._startSavingStartupRecording();
      case false: return this._startDiscardingStartupRecording();
    }
  }

  _startSavingStartupRecording() {
    const {startupRecording} = this;

    this.api.requestIdleCallback(async () => {
      const artifactPath = await this.preparePathForStartupArtifact();
      await startupRecording.save(artifactPath);
      this.api.untrackArtifact(startupRecording);
    });

    this.startupRecording = null;
  }

  _startDiscardingStartupRecording() {
    const {startupRecording} = this;

    this.api.requestIdleCallback(async () => {
      await startupRecording.discard();
      this.api.untrackArtifact(startupRecording);
    });

    this.startupRecording = null;
  }
}

module.exports = StartupAndTestRecorderPlugin;