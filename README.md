# socket-serializer
A javascript serializer for socket.
Purpose is to serialize object, buffer, string, number and boolean with the minimum of transformations in order to improve performance.
For instance buffers remain untouched and go through socket without any changes (copy, merge, split...).
It is why we do not use classic serializations like BSON or protobuf.

# Features
* Parsing/Serialization API
* Buffer Readers API
* Socket and Buffer Writers API
* Basic Socket API

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
    isNull(): boolean;
    isUndefined(): boolean;
    isArray(): boolean;
    isArrayWithSize(): boolean;
    isArrayWithLen(): boolean;
    isObject(): boolean;
    isString(): boolean;
    isBuffer(): boolean;
    isNumber(): boolean;
    isBoolean(): boolean;

 // Generic serialization
    serialize(data: any): void;

 // Specific serialization methods
    serializeNumber(dataNumber: number): void;
    serializeBoolean(dataBoolean: boolean): void;
    serializeString(data: string, encoding?: BufferEncoding): void;
    serializeObject(dataObject: Object): void;
    serializeBuffer(data: Buffer): void;
    serializeArray(args: any[]): void;
 
 // Generic parsing method
    parse(): any;

 // Specific parsing methods
    parseBoolean(): boolean | null;
    parseNumber(): number | null;
    parseObject(): any | null;
    parseString(encoding?: BufferEncoding): string | null;
    parseBuffer(): Buffer | null;
    parseArray(): any[] | null;
    parseArrayAt(index: number): any | null;
    parseArraySlice(start?: number, end?: numbers): any | null;

    write(bufferWriter: Writer, data: any): void;
    read(bufferReader: Reader): any;
}
```
## Parsing methods
specific 'parse' methods (parseBoolean, parseNumber...) returns null if it does not mach the type of the stream.

## Serialization methods
Result of serializations is in 'buffer' readonly property.

# Buffer Writer/Reader API
```ts
export interface Writer {
    readonly buffer: Buffer;
    readonly buffers: Buffer[];
    readonly length: number;

    writeByte(data: number): number;
    writeBytes(dataArray: number[]): number;
    writeUInt32(data: number): number;
    writeDouble(data: number): number;
    writeString(data: string, encoding?: BufferEncoding, len?: number): number;
    writeBuffer(data: Buffer, sourceStart?: number, sourceEnd?: number): number;
    write(writer: Writer): number;

}
```

## Buffer[Writer/Reader] vs BufferList[Writer/Reader]
BufferList accumulates intermediate buffers in a list. It concatenates them when calling buffer method.

## SocketWriter
When serializing you can write directly to socket using a SocketWriter classes. Each one has a different strategies
* SocketWriter
Write immediately on socket, piece by piece
* DelayedSocketWriter
Write data on socket packet by packet
* BufferedSocketWriter
Write packets when reaching a size

# Sample
```js
const socketHelpers = require('socket-port-helpers');
const socketSerialModule = require('socket-serializer');

let port = 49152;
socketHelpers.findFirstFreePort({portRange: `>=${port}`, log: false, testConnection: true })
.then((port) => {
    let server = new socketSerialModule.IpcPacketNet();
    server.addListener('listening', () => {
        let client = new socketSerialModule.IpcPacketNet();
        client.addListener('packet', (ipcPacketBuffer) => {
            let paramObject = ipcPacketBuffer.parseObject();
            console.log(JSON.stringify(paramObject));
        });
        client.addListener('error', (err) => {
        });
        client.connect(port);
    });
    server.addListener('connection', (socket) => {
        const paramObject = {
            num: 10.2,
            str: "test",
            bool: true,
            array: ["", 10.2, true]
        };
        var ipb = new socketSerialModule.IpcPacketBuffer();
        ipb.serializeObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen(port);
});
```

# MIT License

Copyright (c) 2017 Emmanuel Kimmerlin

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.