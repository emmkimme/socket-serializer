# socket-serializer
A javascript serializer for socket.
Purpose is to serialize object, buffer, string, number and boolean with the minimum of transformations in order to improve performance.
For instance buffers remain untouched and go through socket without any changes (copy, merge, split...).
It is why we do not use classic serialization like BSON or protobuf.

# Features
* Basic Socket API
* Serialization API

# Installation
```Batchfile
npm install socket-serializer
```

Dependencies
* http://nodejs.org/

#Sample
```js
const portfinder = require('portfinder');

const ipbModule = require('../lib/ipcPacketBuffer');
const ipnModule = require('../lib/ipcPacketNet');

portfinder.getPortPromise({ port: 49152 }).then((port) => {
    let server = new ipnModule.IpcPacketNet({ port: port });
    server.addListener('listening', () => {
        let client = new ipnModule.IpcPacketNet({ port: port });
        client.addListener('packet', (ipcPacketBuffer) => {
            var ipb = new ipbModule.IpcPacketBuffer();
            let paramObject = ipb.parseObject();
            console.log(JSON.stringify(paramObject));
        });
        client.addListener('error', (err) => {
        });
        client.connect();
    });
    server.addListener('connection', (socket) => {
        const paramObject = {
            num: 10.2,
            str: "test",
            bool: true
        };
        var ipb = new ipbModule.IpcPacketBuffer();
        ipb.serializeObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen();
});
```

# MIT License

Copyright (c) 2017 Emmanuel Kimmerlin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.