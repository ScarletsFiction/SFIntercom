<a href='https://patreon.com/stefansarya'><img src='https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fstefansarya%2Fpledges&style=for-the-badge' height='20'></a>

[![Written by](https://img.shields.io/badge/Written%20by-ScarletsFiction-%231e87ff.svg)](LICENSE)
[![Software License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

# SFIntercom
SFIntercom is a client-side library that allow cross-tab communication with same domain.
It can broadcast to all listener on a different tab or window, but can't broadcast to other browser instance.

This library was useful for syncronizing message, notification, and other data.

## Sample Usage

```js
// First tab
var client1 = new SFIntercom();
client1.on('log', console.log);
client1.on('warn', console.warn);

// Second tab
var client2 = new SFIntercom();
client2.on('log', console.log);
client2.emit('log', 'Hello from second tab'); // Broadcast to all except this tab

// Third tab
var broadcaster = new SFIntercom();
broadcaster.emit('log', "Hello from third tab"); // Broadcast to all
broadcaster.emit('warn', "Hello warn"); // Broadcast to all who listen to 'warn'
```

## Contribution

If you want to help in SFIntercom library, please fork this project and edit on your repository, then make a pull request to here.

Keep the code simple and clear.

## License

SFIntercom is under the MIT license.
But don't forget to put the a link to this repository.
