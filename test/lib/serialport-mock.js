const EventEmitter = require('events');

let _lastInstance = null;
let _lastTx = '';

module.exports = class SerialPort extends EventEmitter {
  constructor() {
    super();
    _lastInstance = this;
  }

  write(str, cb) {
    _lastTx = str.trim();
    process.nextTick(cb);
  }

  drain(cb) {
    process.nextTick(cb);
  }

  simulatePortOpen() {
    process.nextTick(() => this.emit('open'));
  }

  simulatePortClose() {
    process.nextTick(() => this.emit('close'));
  }

  simulateRx(strOrBuffer) {
    process.nextTick(() => {
      this.emit('data', strOrBuffer);
    });
  }

  getDataListenerCount() {
    return this.listenerCount('data');
  }

  getLastTx() {
    return _lastTx;
  }

  static getLastInstance() {
    return _lastInstance;
  }
}