const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const SerialportMock = require('./lib/serialport-mock.js');

describe('basic checks', function() {
  const Driver = require('../lib/td12xxDriver.js');

  it('should trigger an error if the portname is not given', function() {
    expect(() => new Driver).to.throw(Error, /required/);
  });

  it('should proxy errors triggered by the serialport lib', function(done) {
    let d = new Driver('/dev/deviceLikelyNotExist');
    d.on('error', (e) => {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.match(/cannot\s*open/);
      done();
    });
  });
});

describe('core features', function() {
  const Driver = proxyquire('../lib/td12xxDriver.js', {serialport: SerialportMock});

  it('should raise an error if the port takes more than 2000ms to open', function(done) {
    this.timeout(3000);
    let d = new Driver('test');
    d.waitPortReady().then(done.bind(null, new Error('Port was resolved but should not')))
    .catch(done.bind(null, null));
  });

  it('should handle correctly data received on port', function(done) {
    let d = new Driver('test');
    let mock = SerialportMock.getLastInstance();
    mock.simulatePortOpen();
    d.checkModuleIsAlive().then(done.bind(null, null), done);
    mock.simulateRx('OK');
  });

  it('should fail if receive the error reply', function(done) {
    let d = new Driver('test');
    let mock = SerialportMock.getLastInstance();
    mock.simulatePortOpen();
    d.checkModuleIsAlive().then(done.bind(null, new Error('Promise has not been rejected')))
    .catch(done.bind(null, null));
    mock.simulateRx('ERROR');
  });

  it('event listener queue should be empty after reply is handled', function(done) {
    let d = new Driver('test');
    let mock = SerialportMock.getLastInstance();
    mock.simulatePortOpen();
    d.checkModuleIsAlive().then(function() {
      expect(mock.getDataListenerCount()).to.be.eql(0);
      done();
    }).catch(done);
    expect(mock.getDataListenerCount()).to.be.eql(1);
    mock.simulateRx('OK');
  });

  it('should raise an error if reply timeout is reached', function(done) {
    let d = new Driver('test');
    let mock = SerialportMock.getLastInstance();
    mock.simulatePortOpen();
    d._commandSend('AT', 'OK', 'ERROR', 1000).then(done.bind(null, new Error('Promise should be rejected!')))
    .catch(function(e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.match(/timeout/);
      done()
    }).catch(done); // chain an extra catch to forward exceptions triggered by the last expectations
  });
});