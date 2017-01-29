const SerialPort = require('serialport');
const Events = require('events').EventEmitter;

class Driver extends Events {
  constructor(portName) {
    super()
    this._portName = portName;
    this._serial = new SerialPort(portName, {
      parser: SerialPort.parsers.readline('\r\n')
    });
    //proxy error event
    this._serial.on('error', (...args) => this.emit('error', ...args));
  }
  _waitDataReceive(successReply, errorReply = 'ERROR', timeout = 2000) {
    return new Promise((resolve, reject) => {
      let timedout = false;
      let timer = setTimeout(() => timedout = true, timeout);
      const dataHandler = (data) => {
        let done = false;
        if(timedout) {
          reject(new Error('timeout'));
          done = true;
        }
        else {
          switch(data) {
            case successReply:
              resolve();
              done = true;
              break;
            case errorReply:
              reject();
              done = true;
              break;
          }
        }
        if(done) {
          this._serial.removeListener('data', dataHandler);
          clearTimeout(timer);
        }
      }
      this._serial.on('data', dataHandler);
    });
  }
  _writeAndDrain(dataToWrite) {
    return new Promise((resolve, reject) =>{
      this._serial.write(dataToWrite, (error) => {
        if(error) return reject(error);
        this._serial.drain((error) => error?reject(err):resolve());
      });
    });
  }
  _checkModuleAlive() {
    return this._writeAndDrain('AT\r')
    .then(() => this._waitDataReceive('OK'))
  }
  _commandSend(hexStr) {

  }
  sendBytes(buffer) {
    const str = buffer.toString('hex');
    this._commandSend(str)
  }
}

module.exports = Driver;