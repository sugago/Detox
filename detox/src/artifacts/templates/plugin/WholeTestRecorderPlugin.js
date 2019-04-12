const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class WholeTestRecorderPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.testRecording = null;
  }

  async onBeforeEach(testSummary) {
    await super.onBeforeEach(testSummary);

    if (this.enabled) {
      const recording = this.createTestRecording();
      await recording.start();

      this.api.trackArtifact(recording);
      this.testRecording = recording;
    }
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);

    if (this.testRecording) {
      await this.testRecording.stop();
      this._startFinalizingTestRecording();
    }
  }

  /***
   * @abstract
   * @protected
   */
  createTestRecording() {}

  /***
   * @abstract
   */
  async preparePathForTestArtifact(testSummary) {}

  _startFinalizingTestRecording() {
    const {testSummary} = this.context;

    switch (this.shouldKeepArtifactOfTest(testSummary)) {
      case true: return this._startSavingTestRecording();
      case false: return this._startDiscardingTestRecording();
    }
  }

  _startSavingTestRecording() {
    const {testRecording, context: {testSummary}} = this;

    this.api.requestIdleCallback(async () => {
      const recordingArtifactPath = await this.preparePathForTestArtifact(testSummary);
      await testRecording.save(recordingArtifactPath);
      this.api.untrackArtifact(testRecording);
    });

    this.testRecording = null;
  }

  _startDiscardingTestRecording() {
    const {testRecording} = this;

    this.api.requestIdleCallback(async () => {
      await testRecording.discard();
      this.api.untrackArtifact(testRecording);
    });

    this.testRecording = null;
  }
}

module.exports = WholeTestRecorderPlugin;