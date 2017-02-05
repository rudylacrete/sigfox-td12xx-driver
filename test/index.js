const Driver = require('..');

const d = new Driver('/dev/ttyAMA0');
d.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

d.checkModuleIsAlive().then(() => console.log('Alive ......'))
.then(() => d.dumpModuleInformations())
.then(() => d.sendBytes(Buffer.from('Hello world')))
.then(() => console.log('all done ...'))
.catch(console.error.bind(console));