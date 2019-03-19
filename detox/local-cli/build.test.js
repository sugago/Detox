describe('build', () => {
  let mockChildProcess;
  let command;

  beforeEach(() => {
    spyOn(console, 'log');

    mockChildProcess = {
      execSync: jest.fn(),
    };

    jest.mock('child_process', () => mockChildProcess);
    command = require('./__helpers__/CommandBuilder').init().withCommand('build');
  });

  describe('when there is no detox section', () => {
    beforeEach(() => command.withPackageJson({ detox: undefined }));

    it('should fail with a user-friendly error', async () => {
      expect(command.exec()).rejects.toThrowErrorMatchingSnapshot();
      expect(mockChildProcess.execSync).not.toHaveBeenCalled();
    });
  });

  describe('when there are no detox configurations', () => {
    beforeEach(() => command.withPackageJson({}));

    it('should fail with a user-friendly error', async () => {
      expect(command.exec()).rejects.toThrowErrorMatchingSnapshot();
      expect(mockChildProcess.execSync).not.toHaveBeenCalled();
    });
  });

  describe('when there is a single config', () => {
    beforeEach(() => command.withPackageJson({
      configurations: {
        only: {
          build: "echo \"only\""
        }
      }
    }));

    it('should run the build script inside, even if configuration is not specified', async () => {
      await command.exec();
      expect(mockChildProcess.execSync).toHaveBeenCalledWith(expect.stringContaining('only'), expect.anything());
    });

    it('should fail if the configuration is specified but not found', async () => {
      expect(command.withArgs('-c nonexistent').exec()).rejects.toThrowErrorMatchingSnapshot();
      expect(mockChildProcess.execSync).not.toHaveBeenCalled();
    });
  });

  describe('when there are multiple configs', () => {
    beforeEach(() => command.withPackageJson({
      configurations: {
        only: {
          build: "echo \"only\""
        },
        myconf: {
          build: "echo \"myconf\""
        },
        noBuildConfig: {
          // no build
        },
      }
    }));

    it('should fail when configuration is not specified', async () => {
      expect(command.exec()).rejects.toThrowErrorMatchingSnapshot();
      expect(mockChildProcess.execSync).not.toHaveBeenCalled();
    });

    it('should fail when the build script is not found in the specified configuration', async () => {
      expect(command.withArgs('-c noBuildConfig').exec()).rejects.toThrowErrorMatchingSnapshot();
      expect(mockChildProcess.execSync).not.toHaveBeenCalled();
    });

    it('should run the build script if it is specified via CLI', async () => {
      await command.withArgs('-c myconf').exec();
      expect(mockChildProcess.execSync).toHaveBeenCalledWith(expect.stringContaining('myconf'), expect.anything());
    });

    it('should run the build script if it is specified via environment variable', async () => {
      await command.withEnv({ DETOX_CONFIGURATION: 'myconf' }).exec();
      expect(mockChildProcess.execSync).toHaveBeenCalledWith(expect.stringContaining('myconf'), expect.anything());
    });
  });
});
