import { expect } from 'chai';
import { Buffer } from 'buffer';
import { BufferListWriter } from '../../src/buffer/bufferListWriter';
import { BufferReader } from '../../src/buffer/bufferReader';
import { Reader } from '../../src/buffer/reader';
import { Writer } from '../../src/buffer/writer';
import { IpcPacketCore } from '../../src/packet/ipcPacketCore';
import { IpcPacketType } from '../../src/packet/ipcPacketHeader';
import { IpcPacketReader } from '../../src/packet/ipcPacketReader';
import { IpcPacketWriter } from '../../src/packet/ipcPacketWriter';
import * as bigData from './big-data.json';

const reportTime = false;

class StringifyWriter extends IpcPacketWriter {
    protected _writeObject(bufferWriter: Writer, dataObject: unknown, cb: IpcPacketWriter.Callback): void {
        const stringify = JSON.stringify(dataObject);
        const buffer = Buffer.from(stringify);
        this._writeDynamicBuffer(bufferWriter, IpcPacketType.ObjectSTRINGIFY, buffer, cb);
    }
}

class StringifyReader extends IpcPacketReader {
    protected _readContentObject(bufferReader: Reader, contentSize: number) {
        const data = bufferReader.readString('utf8', contentSize);
        return JSON.parse(data);
    }
}

class WriterDirect extends IpcPacketWriter {
    protected _writeObject(bufferWriter: Writer, dataObject: unknown, cb: IpcPacketWriter.Callback): void {
        const contentWriter = new BufferListWriter();
        // let keys = Object.getOwnPropertyNames(dataObject);
        const keys = Object.keys(dataObject as object);
        for (let i = 0, l = keys.length; i < l; ++i) {
            const key = keys[i];
            const desc = Object.getOwnPropertyDescriptor(dataObject, key);
            if (desc && typeof desc.value !== 'function') {
                const buffer = Buffer.from(key, 'utf8');
                contentWriter.writeUInt32(buffer.length);
                contentWriter.writeBuffer(buffer);
                // this.write(contentBufferWriter, desc.value || dataObject[key]);
                this.write(contentWriter, desc.value);
            }
        }
        this._writeDynamicContent(bufferWriter, IpcPacketType.ObjectSTRINGIFY, contentWriter, cb);
    }
}

class ReaderDirect extends IpcPacketReader {
    protected _readContentObject(bufferReader: Reader, contentSize: number) {
        const offsetContentSize = bufferReader.offset + contentSize;
        const dataObject: Record<string, unknown> = {};
        while (bufferReader.offset < offsetContentSize) {
            const keyLen = bufferReader.readUInt32();
            const key = bufferReader.readString('utf8', keyLen);
            dataObject[key] = this._read(bufferReader);
        }
        return dataObject;
    }
}

function test(ipcPacketCoreClass: typeof IpcPacketCore) {
    describe('Object serialization comparison', () => {
        describe('Object - big json', () => {
            it('JSON', () => {
                const ipcPacketCore = new ipcPacketCoreClass(undefined, new StringifyReader(), new StringifyWriter());
                const bufferWriter = new BufferListWriter();
                reportTime && console.time('JSON serialize - big json');
                ipcPacketCore.write(bufferWriter, bigData);
                reportTime && console.timeEnd('JSON serialize - big json');

                const bufferReader = new BufferReader(bufferWriter.buffer);
                reportTime && console.time('JSON deserialize - big json');
                const newBigData = ipcPacketCore.read(bufferReader);
                reportTime && console.timeEnd('JSON deserialize - big json');
                expect(bigData).to.be.deep.eq(newBigData);
            });

            it('JSONParser', () => {
                const ipcPacketCore = new ipcPacketCoreClass();
                const bufferWriter = new BufferListWriter();
                reportTime && console.time('JSONParser serialize - big json');
                ipcPacketCore.write(bufferWriter, bigData);
                reportTime && console.timeEnd('JSONParser serialize - big json');

                const bufferReader = new BufferReader(bufferWriter.buffer);
                reportTime && console.time('JSONParser deserialize - big json');
                const newBigData = ipcPacketCore.read(bufferReader);
                reportTime && console.timeEnd('JSONParser deserialize - big json');
                expect(bigData).to.be.deep.eq(newBigData);
            });
        });

        describe('Object - small json', () => {
            const busEvent = {
                channel: '/electron-common-ipc/myChannel/myRequest',
                sender: {
                    id: 'MyPeer_1234567890',
                    name: 'MyPeer_customName',
                    date: new Date(),
                    process: {
                        type: 'renderer',
                        pid: 2000,
                        rid: 2,
                        wcid: 10,
                    },
                    testArray: [12, 'str', 3, null, 'end', new Date()],
                },
                request: {
                    replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
                },
            };

            it('JSONParser - small json', () => {
                reportTime && console.time('JSONParser serialize - small json');
                for (let i = 0; i < 10000; ++i) {
                    const ipcPacketCore = new ipcPacketCoreClass();
                    const bufferWriter = new BufferListWriter();
                    ipcPacketCore.write(bufferWriter, busEvent);
                    const bufferReader = new BufferReader(bufferWriter.buffer);
                    const newBusEvent = ipcPacketCore.read(bufferReader);
                    newBusEvent;
                }
                reportTime && console.timeEnd('JSONParser serialize - small json');

                reportTime && console.time('JSONParser deserialize - small json');
                const ipcPacketCore = new ipcPacketCoreClass();
                const bufferWriter = new BufferListWriter();
                ipcPacketCore.write(bufferWriter, busEvent);
                for (let i = 0; i < 10000; ++i) {
                    const bufferReader = new BufferReader(bufferWriter.buffer);
                    const newBusEvent = ipcPacketCore.read(bufferReader);
                    newBusEvent;
                }
                reportTime && console.timeEnd('JSONParser deserialize - small json');
            });

            it('direct2 - small json', () => {
                reportTime && console.time('direct2 serialize - small json');
                for (let i = 0; i < 10000; ++i) {
                    const ipcPacketCore = new ipcPacketCoreClass();
                    const bufferWriter = new BufferListWriter();
                    ipcPacketCore.write(bufferWriter, busEvent);
                    const bufferReader = new BufferReader(bufferWriter.buffer);
                    const newBusEvent = ipcPacketCore.read(bufferReader);
                    newBusEvent;
                    // Can not compare, properties' order or indentation are not the same
                    // assert(ObjectEqual(bigData, newBusEvent));
                }
                reportTime && console.timeEnd('direct2 serialize - small json');

                reportTime && console.time('direct2 deserialize - small json');
                const ipcPacketCore = new ipcPacketCoreClass(undefined, new ReaderDirect(), new WriterDirect());
                const bufferWriter = new BufferListWriter();
                ipcPacketCore.write(bufferWriter, busEvent);
                for (let i = 0; i < 10000; ++i) {
                    const bufferReader = new BufferReader(bufferWriter.buffer);
                    const newBusEvent = ipcPacketCore.read(bufferReader);
                    newBusEvent;
                }
                reportTime && console.timeEnd('direct2 deserialize - small json');
            });
        });
    });
}

// test(IpcPacketBuffer);
// test(IpcPacketBufferList);
test(IpcPacketCore);
