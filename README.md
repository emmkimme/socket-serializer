# socket-serializer
A javascript serializer for socket.
Purpose is to serialize object, buffer, string, number and boolean with the minimum of transformations in order to improve performance.
For instance buffers remain untouched and go through socket without any changes (copy, merge, split...).
It is why we do not use classic serialization like BSON or protobuf.

# Features
* Basic Socket API
* Parsing/Serialization API

# Installation
```Batchfile
npm install socket-serializer
```

Dependencies
* http://nodejs.org/

# Parsing/Serialization API
```ts
export class IpcPacketBuffer extends IpcPacketBufferWrap {
    readonly buffer: Buffer;
    isNotValid(): boolean;
    isNotComplete(): boolean;
    isArray(): boolean;
    isArrayWithSize(): boolean;
    isArrayWithLen(): boolean;
    isObject(): boolean;
    isString(): boolean;
    isBuffer(): boolean;
    isNumber(): boolean;
    isBoolean(): boolean;
 
    serializeNumber(dataNumber: number): void;
    serializeBoolean(dataBoolean: boolean): void;
    serializeString(data: string, encoding?: string): void;
    serializeObject(dataObject: Object): void;
    serializeBuffer(data: Buffer): void;
    serializeArray(args: any[]): void;
    serialize(data: any): void;
 
    static serializeToSocket(data: any, socket: net.Socket): number;
 
    parse(): any;
    parseBoolean(): boolean | null;
    parseNumber(): number | null;
    parseObject(): any | null;
    parseString(encoding?: string): string | null;
    parseBuffer(): Buffer | null;
    parseArrayAt(index: number): any | null;
    parseArray(): any[] | null;
}
```
## Parsing methods
specific 'parse' methods (parseBoolean, parseNumber...) returns null if it does not mach the type of the stream.

## Serialization methods
Result of serializations is in 'buffer' readonly property.
'serializeToSocket' writes directly the stream to a socket.


# Sample
```js
const portfinder = require('portfinder');

const socketSerialModule = require('socket-serializer');

portfinder.getPortPromise({ port: 49152 }).then((port) => {
    let server = new socketSerialModule.IpcPacketNet({ port: port });
    server.addListener('listening', () => {
        let client = new socketSerialModule.IpcPacketNet({ port: port });
        client.addListener('packet', (ipcPacketBuffer) => {
            let paramObject = ipcPacketBuffer.parseObject();
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
        var ipb = new socketSerialModule.IpcPacketBuffer();
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