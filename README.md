This npm module provides a simple and minimalist API to interact with any sigfox modules based on the td12xx chip.
Not all AT commands are implemented yet so contributions are welcomed.
The code has been tested with a kit based on the TD1207 chip.

# Installation

```
npm install sigfox-td12xx-driver

```

The module require node.js to be >= 6.10.

# Usage

Basically, you just need to require the module and instanciate the driver with the proper port name:

```
const Driver = require('sigfox-td12xx-driver');
const driver = new Driver('/dev/ttyS0');

driver.on('error', (error) => {
	console.error(error);
});

```

From there, you're all set if you got no error. All methods writting on the UART port are already checking if the underlying port is up and running, ready to received and so on. All the bytes drain logic is also handled by the module.
All the provided methods return an ES6 promise so you can chain them with ease:

```
driver.checkModuleIsAlive().then(() => driver.dumpModuleInformations())
.then(() => driver.sendBytes(Buffer.from('Hi')))
.then(() => console.log('All done ;)'))
.catch(console.error.bind(console));
```

## checkModuleIsAlive()

Check if the chip is working in sending a simple `AT` command and check for the correct reply.
```
driver.checkModuleIsAlive().then(() => {
	// everything is ok
}).catch(console.error.bind(error));
```

## getModuleInformation(code)

Retrieve specific informations from the sigfox modem. All registered code are published through the `Driver.constants` static property.

```
driver.getModuleInformation(Driver.constants.COMMAND.ATI.moduleTemperature).then((temp) => {
	console.log(temp);
}).catch(console.error.bind(error));
```

## dumpModuleInformations()

Display all available module specific data. For debug purpose only.

```
driver.dumpModuleInformations(Driver.constants.COMMAND.ATI.moduleTemperature).then(() => {
	// done
}).catch(console.error.bind(error));
```

## sendBytes(buffer)

Send the given buffer through the sigfox network through the basic send method (no ack). For now the are no check on the buffer size regarding sigfox payload's max length. Only buffer are accepted.

```
driver.sendBytes(Buffer.from('Hello World!')).then(() => {
	// done
}).catch(console.error.bind(error));
```

# TODO

- ensure parallel calls are handled in the good order with mutexes or something (command queue)
- implement missing AT commands
- allow to modify the core options (timeout, ...)

# Licence

MIT