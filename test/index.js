const Driver = require('..');

const d = new Driver('/dev/ttyAMA0');
d.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

d.checkModuleIsAlive().then(() => console.log('Alive ......'))
.then(() => d.dumpModuleInformations())
//.then(() => d.sendBytes(Buffer.from('Hello world')))
.then(() => console.log('all done ...'))
.catch(console.error.bind(console));

let lastIndex = 0;

const teleinfo = require('../teleinfo.js');
const trameevents = teleinfo('/dev/ttyUSB0');
trameevents.on('tramedecodee', function(trame) {
	lastIndex = trame.BASE;
});
trameevents.on('error', console.error.bind(console));

const sendLastBase = function() {
	console.log("Sending index " + lastIndex);
	let b = Buffer.alloc(4);
	b.writeUInt32BE(lastIndex);
	d.sendBytes(b).then(console.log.bind(console, 'bytes sent'))
	.catch(console.error.bind(console));

}

setInterval(sendLastBase, 15 * 60 * 1000);