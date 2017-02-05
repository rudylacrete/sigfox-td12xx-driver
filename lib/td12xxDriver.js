const SerialPort = require('serialport');
const Events = require('events').EventEmitter;
const constants = require('./constants.js');

const READY_TIMEOUT = 2000;
const debug = (str) => {
  if(process.env.DEBUG != 1) return;
  console.log(str);
}

class Driver extends Events {

  constructor(portName) {
    super();
    this._portName = portName;
    this._serial = new SerialPort(portName, {
      parser: SerialPort.parsers.readline('\r\n')
    });
    this._handlePortOpen(),
    //proxy error event
    this._serial.on('error', (...args) => this.emit('error', ...args));

  }

  _handlePortOpen() {
    this._ready = new Promise((resolve, reject) => {
      const onPortOpen = () => {
        this._serial.removeListener('open', onPortOpen);
        resolve();
        debug(`Port ${this._portName} is now open`);
      }
      const onPortClose = () => {
        this._serial.removeListener('close', onPortClose);
        this._handlePortOpen();
        debug(`Port ${this._portName} is now close`);
      }
      this._serial.on('open', onPortOpen);
      this._serial.on('close', onPortClose);
    });
  }

  waitPortReady() {
    return new Promise((resolve, reject) => {
      let timedout = false;
      let timeout = setTimeout(() => {
        timedout = true;
        reject(new Error('port ready timeout'));
      }, READY_TIMEOUT);
      this._ready.then(() => {
        if(timedout) return;
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  _waitDataReceive(successReply, errorReply, timeout) {
    return new Promise((resolve, reject) => {
      let timedout = false;
      let dataHistory = [];
      let timer = setTimeout(() => {
        timedout = true;
        reject(new Error('timeout'));
      }, timeout);
      const dataHandler = (data) => {
        debug(`Read data => ${data}`);
        dataHistory.push(data);
        let done = false;
        if(!timedout) {
          switch(data) {
            case successReply:
              resolve(dataHistory);
              done = true;
              break;
            case errorReply:
              reject();
              done = true;
              break;
          }
        }
        if(done || timedout) {
          this._serial.removeListener('data', dataHandler);
          clearTimeout(timer);
        }
      }
      this._serial.on('data', dataHandler);
    });
  }

  _writeAndDrain(dataToWrite) {
    return this.waitPortReady()
    .then(() => {
      return new Promise((resolve, reject) => {
        debug(`Writting ${dataToWrite} ...`);
        this._serial.write(dataToWrite, (error) => {
          if(error) return reject(error);
          this._serial.drain((error) => error ? reject(err) : resolve());
        });
      })
    });
  }

  _commandSend(hexStr, successReply = 'OK', errorReply = 'ERROR', timeout = 5000) {
    this._writeAndDrain(hexStr + '\r')
    .catch(console.error.bind(console));
    // don't wait the previous promise to listen to data, otherwise we can miss them
    return this._waitDataReceive(successReply, errorReply, timeout);
  }

  checkModuleIsAlive() {
    return this._commandSend('AT');
  }

  sendBytes(buffer) {
    const command = `AT$SS=${buffer.toString('hex')}`;
    return this._commandSend(command, 'OK', 'ERROR', 10000);
  }

  getModuleInformation(informationCode) {
    return this._commandSend(`ATI${informationCode}`)
    .then((dataHistory) => {
      // because echo is activated by default, the result is the second line
      return dataHistory[1] || '';
    });
  }

  dumpModuleInformations() {
    let p = Promise.resolve();
    for(let code in constants.COMMAND.ATI) {
      p = p.then(() => {
        return this.getModuleInformation(constants.COMMAND.ATI[code])
        .then((res) => console.log(`|||||||||||||| ${code} = ${res}`));
      });
    }
    return p;
  }
}

module.exports = Driver;