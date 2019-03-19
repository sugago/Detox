describe('run-server', () => {
  let DetoxServer;
  let command;

  beforeEach(() => {
    jest.mock('../src/server/DetoxServer');
    DetoxServer = require('../src/server/DetoxServer');
    command = require('./__helpers__/CommandBuilder').init().withCommand('run-server');
  });

  it('starts the server', async () => {
    await command.exec();
    expect(DetoxServer).toHaveBeenCalledWith(expect.objectContaining({ port: 8099 }));
  });

  it('throws if the port number is out of range', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(command.withEnv({ DETOX_PORT: 99999 }).exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(command.withArgs('-p 100000').exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(command.withArgs('-p 0').exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(command.withArgs('-p DEADBEEF').exec()).rejects.toThrowErrorMatchingSnapshot();
    expect(DetoxServer).not.toHaveBeenCalled();
  });
});
