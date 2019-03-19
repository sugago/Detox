jest.spyOn(console, 'log');

describe('test', () => {
  let mockChildProcess;
  let command;

  beforeEach(() => {
    mockChildProcess = {
      execSync: jest.fn(),
    };

    jest.mock('child_process', () => mockChildProcess);
    command = require('./__helpers__/CommandBuilder').init().withCommand('test');
  });

  describe('mocha', () => {
    it('should pass most args to mocha CLI', async () => {
      await command.withPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      }).withArgs('e2e').exec();

      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          'node_modules/.bin/mocha --opts e2e/mocha.opts --configuration only --grep :ios: --invert --record-logs none --take-screenshots none --record-videos none --artifacts-location "artifacts/only.'
        ),
        expect.anything()
      );
      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringMatching(/ e2e$/),
        expect.anything()
      );
    });
  });

  describe('jest', () => {
    it('should pass most args as environment variables', async () => {
      await command
        .withPackageJson({
          testRunner: 'jest',
          configurations: {
            only: {
              type: 'android.emulator'
            }
          }
        })
        .withArgs('e2e')
        .exec();

      expect(mockChildProcess.execSync).toHaveBeenCalledWith(
        expect.stringContaining(
          `node_modules/.bin/jest --config=e2e/config.json --maxWorkers=1 \'--testNamePattern=^((?!:ios:).)*$\' e2e`
        ),
        expect.anything()
      );
    });
  });

  it('fails with a different runner', async () => {
    expect(command.withPackageJson({
      testRunner: 'ava',
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    }).exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('throws an error if the platform is android and the workers are enabled', async () => {
    expect(command
      .withPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      })
      .withArgs('--workers 2')
      .exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(mockChildProcess.execSync).not.toHaveBeenCalled();
  });

  it('sets default value for debugSynchronization', async () => {
    await command
      .withPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      })
      .withEnv({ DETOX_DEBUG_SYNCHRONIZATION: 'true' })
      .withArgs('e2e')
      .exec();

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'node_modules/.bin/mocha --opts e2e/mocha.opts --configuration only --debug-synchronization 3000 --grep :ios: --invert --record-logs none --take-screenshots none --record-videos none --artifacts-location "artifacts/only.'
      ),
      expect.anything()
    );
  });

  it('passes extra args to the test runner', async () => {
    await command
      .withPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      })
      .withArgs('--unknown-property 42 -- arg1 --flag2').exec();

    expect(mockChildProcess.execSync).toHaveBeenCalledWith(expect.stringContaining(' --unknownProperty 42 arg1 --flag2'), expect.anything());
  });
});
