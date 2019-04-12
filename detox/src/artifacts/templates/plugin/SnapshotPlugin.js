const ArtifactPlugin = require('./ArtifactPlugin');

/***
 * @abstract
 */
class SnapshotPlugin extends ArtifactPlugin {
  constructor({ api }) {
    super({ api });

    this.snapshots = {
      perTest: {},
      perSession: {},
    };

    this.startSavingSnapshot = this.startSavingSnapshot.bind(this);
    this.startDiscardingSnapshot = this.startDiscardingSnapshot.bind(this);
  }

  async onBeforeEach(testSummary) {
    this.context.testSummary = null;
    this.flushSnapshots();

    await super.onBeforeEach(testSummary);
  }

  async onAfterEach(testSummary) {
    await super.onAfterEach(testSummary);
    this.flushSnapshots();
  }

  async onAfterAll() {
    await super.onAfterAll();
    await this.flushSnapshots();
  }

  /***
   * Creates a handle for a test artifact (video recording, log, etc.)
   *
   * @abstract
   * @protected
   * @return {Artifact} - an object with synchronous .discard() and .save(path) methods
   */
  createTestArtifact() {}

  /***
   * @protected
   * @abstract
   */
  async preparePathForSnapshot(testSummary, snapshotName) {}

  /***
   * @protected
   */
  flushSnapshots() {
    this._flushSnapshotsMap('perSession', this.shouldKeepArtifactsOfTestSession());

    if (this.isInsideRunningTest()) {
      const {testSummary} = this.context;
      this._flushSnapshotsMap('perTest', this.shouldKeepArtifactOfTest(testSummary));
    }
  }

  _flushSnapshotsMap(key, shouldKeep) {
    if (shouldKeep === undefined) {
      return;
    }

    const snapshotsMap = this.snapshots[key];
    const startFinalizingSnapshot = shouldKeep
      ? this.startSavingSnapshot
      : this.startDiscardingSnapshot;

    for (const name of Object.keys(snapshotsMap)) {
      const snapshot = snapshotsMap[name];

      startFinalizingSnapshot(snapshot, name);
      delete snapshotsMap[name];
    }
  }

  /***
   * @protected
   */
  async takeSnapshot(name) {
    const snapshot = this.createTestArtifact();

    if (this.isInsideRunningTest()) {
      this.snapshots.perTest[name] = snapshot;
    } else {
      this.snapshots.perSession[name] = snapshot;
    }

    this.api.trackArtifact(snapshot);
    await snapshot.start();
    await snapshot.stop();
  }

  /***
   * @protected
   */
  startSavingSnapshot(snapshot, name) {
    const {testSummary} = this.context;

    this.api.requestIdleCallback(async () => {
      const snapshotArtifactPath = await this.preparePathForSnapshot(testSummary, name);
      await snapshot.save(snapshotArtifactPath);
      this.api.untrackArtifact(snapshot);
    });
  }

  /***
   * @protected
   */
  startDiscardingSnapshot(snapshot) {
    this.api.requestIdleCallback(async () => {
      await snapshot.discard();
      this.api.untrackArtifact(snapshot);
    });
  }
}

module.exports = SnapshotPlugin;
