jest.mock('../../utils/argparse');
jest.mock('../../utils/logger');

const _ = require('lodash');
const ScreenshotPlugin = require('./ScreenshotPlugin');
const ArtifactsApi = require('../templates/plugin/__mocks__/ArtifactsApi.mock');
const testSummaries = require('../templates/plugin/__mocks__/testSummaries.mock');

describe('ScreenshotArtifactPlugin', () => {
  let api;
  let argv = {
    takeScreenshots: undefined,
  };

  let _plugin;
  let plugin = () => {
    if (!_plugin) {
      _plugin = createFakeScreenshotPlugin();
    }

    return _plugin;
  };

  beforeEach(() => {
    _plugin = null;
    api = new ArtifactsApi();
    api.preparePathForArtifact.mockImplementation((name, testSummary) => {
      if (testSummary) {
        return `${name}.png`;
      } else {
        return `${testSummary.title}/${name}.png`;
      }
    });

    argv.takeScreenshots = undefined;
  });

  function itShouldNotTakeScreenshot(nth = 1) {
    it('should not take a screenshot', async () => {
      expect(plugin().createTestArtifact).toHaveBeenCalledTimes(nth - 1);
    });
  }

  function itShouldNotRequestIdleCallback() {
    it('should not request an idle callback', async () =>
      expect(api.requestIdleCallback).not.toHaveBeenCalled());
  }

  function itShouldTakeScreenshot(nth) {
    it('should create test artifact', () => {
      expect(plugin().createTestArtifact).toHaveBeenCalledTimes(nth);
      const createdArtifact = plugin().createdArtifacts[nth - 1];

      expect(createdArtifact.start).toHaveBeenCalledTimes(nth);
      expect(createdArtifact.stop).toHaveBeenCalledTimes(nth);
      expect(api.trackArtifact).toHaveBeenCalledWith(createdArtifact);
    });
  }

  function itShouldRequestIdleCallbacks(nth) {
    it(`should request ${nth} idle callback(s)`, async () =>
      expect(api.requestIdleCallback).toHaveBeenCalledTimes(nth));
  }

  describe('--take-screenshots none', () => {
    beforeEach(() => { argv.takeScreenshots = 'none'; });

    describe('onBeforeEach', () => {
      beforeEach(async () => plugin().onBeforeEach(testSummaries.running()));
      itShouldNotTakeScreenshot();
    });

    describe('onAfterEach(failed)', () => {
      beforeEach(async () => plugin().onAfterEach(testSummaries.failed()));

      itShouldNotTakeScreenshot();
      itShouldNotRequestIdleCallback();
    });

    describe('onAfterEach(passed)', () => {
      beforeEach(async () => plugin().onAfterEach(testSummaries.passed()));

      itShouldNotTakeScreenshot();
      itShouldNotRequestIdleCallback();
    });

    describe('onUserAction', () => {
      beforeEach(async () => plugin().onUserAction({
        type: 'takeScreenshot',
        options: {
          name: 'example',
        },
      }));

      itShouldNotTakeScreenshot();
      itShouldNotRequestIdleCallback();
    });
  });

  describe('--take-screenshots manual', () => {
    beforeEach(() => { argv.takeScreenshots = 'manual'; });

    describe('onBeforeEach', () => {
      beforeEach(async () => plugin().onBeforeEach(testSummaries.running()));
      itShouldNotTakeScreenshot();
    });

    describe('onAfterEach(failed)', () => {
      beforeEach(async () => plugin().onAfterEach(testSummaries.failed()));

      itShouldNotTakeScreenshot();
      itShouldNotRequestIdleCallback();
    });

    describe('onAfterEach(passed)', () => {
      beforeEach(async () => plugin().onAfterEach(testSummaries.passed()));

      itShouldNotTakeScreenshot();
      itShouldNotRequestIdleCallback();
    });

    describe('onUserAction', () => {
      beforeEach(async () => plugin().onUserAction({
        type: 'takeScreenshot',
        options: {
          name: 'example',
        },
      }));

      itShouldTakeScreenshot(1);
    });
  });

  describe('--take-screenshots failing', () => {
    beforeEach(() => { argv.takeScreenshots = 'manual'; });

    describe('onBeforeEach', () => {
      beforeEach(async () => plugin().onBeforeEach(testSummaries.running()));
      itShouldTakeScreenshot(1);

      describe('+ onAfterEach(failed)', () => {
        beforeEach(async () => {
          await plugin().onAfterEach(testSummaries.failed());
        });

        itShouldTakeScreenshot(2);
        itShouldRequestIdleCallbacks(2);
      });

      describe('+ onAfterEach(passed)', () => {
        beforeEach(async () => {
          await plugin().onAfterEach(testSummaries.passed());
        });

        itShouldNotTakeScreenshot(2);
      });
    });


    describe('when onAfterEach is called with failing test summary', () => {
      it('should schedule to save and untrack the first artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[0];

        expect(plugin.createdArtifacts[0].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.createdArtifacts[0].save).toBeCalledWith('test/beforeEach.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
      });

      it('should ultimately save and untrack the second artifact', async () => {
        const [saveRequest] = api.requestIdleCallback.mock.calls[1];

        expect(plugin.createdArtifacts[1].save).not.toHaveBeenCalled();
        expect(api.untrackArtifact).not.toHaveBeenCalled();

        await saveRequest();

        expect(plugin.createdArtifacts[1].save).toBeCalledWith('test/afterEach.png');
        expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[1]);
      });
    });
  });
  //
  // describe('when the plugin should not keep a test artifact', () => {
  //   beforeEach(() => plugin.configureToKeepArtifacts(false));
  //
  //   describe('when onBeforeEach and onAfterEach are called', () => {
  //     beforeEach(async () => {
  //       await plugin.onBeforeEach(testSummaries.running());
  //       await plugin.onAfterEach(testSummaries.passed());
  //     });
  //
  //     it('should not create the second test artifact', () => {
  //       expect(plugin.createTestArtifact).toHaveBeenCalledTimes(1);
  //     });
  //
  //     it('should schedule a discard operation for the first artifact and specify itself as an initiator', () => {
  //       expect(api.requestIdleCallback).toHaveBeenCalledTimes(1);
  //       expect(api.requestIdleCallback.mock.calls[0]).toEqual([expect.any(Function)]);
  //     });
  //
  //     it('should ultimately discard and untrack the first artifact', async () => {
  //       const [discardRequest] = api.requestIdleCallback.mock.calls[0];
  //
  //       expect(plugin.createdArtifacts[0].discard).not.toHaveBeenCalled();
  //       expect(api.untrackArtifact).not.toHaveBeenCalled();
  //
  //       await discardRequest();
  //
  //       expect(plugin.createdArtifacts[0].discard).toHaveBeenCalledTimes(1);
  //       expect(api.untrackArtifact).toBeCalledWith(plugin.createdArtifacts[0]);
  //     });
  //   });
  // });


  function createFakeScreenshotPlugin() {
    const argparse = require('../../utils/argparse');
    argparse.getArgValue.mockImplementation((key) => {
      switch (key) {
        case 'take-screenshots': return argv.takeScreenshots;
      }
    });

    class FakeScreenshotPlugin extends ScreenshotPlugin {
      constructor(options) {
        super({ ...options, argparse });

        this.createTestArtifact = jest.fn(this.createTestArtifact.bind(this));
        this.createdArtifacts = [];
      }

      createTestArtifact() {
        super.createTestArtifact();

        const artifact = {
          start: jest.fn(),
          stop: jest.fn(),
          save: jest.fn(),
          discard: jest.fn(),
        };

        this.createdArtifacts.push(artifact);
        return artifact;
      }
    }

    return new FakeScreenshotPlugin({ api });
  }
});

