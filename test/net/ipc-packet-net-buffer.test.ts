import { expect } from 'chai';
import { Buffer } from 'buffer';
import { findFirstFreePort } from 'socket-port-helpers';
import { IpcPacketSocket } from '../../src/socket/ipcPacketSocket';
import { IpcPacketBuffer } from '../../src/packet/ipcPacketBuffer';
import { SocketWriter } from '../../src/socket/socketWriter';
import { BufferedSocketWriter, DelayedSocketWriter } from '../../src/socket/socketBufferWriter';

const timeoutDelay = 500;
const current_port = 49152;
const shouldLog = false;

enum SocketWriterType {
    Write,
    SerializeWrite,
    SocketWriter,
    DelayedSocketWriter,
    BufferedSocketWriter,
}

/**
 * This method creates .Net socket and server. Server starts listening and after that clients is
 * created and connected to the server. Once client is connected server sends a 'packet' to
 * the client. Client verifies that the packet content is expected and resolves the promise.
 * @param param the object that will be serialized and passed between the client and the server
 * @param socketWriterType the type fo the operation to check on the server side
 */
function testSerializationWithSocket(param: unknown, socketWriterType: SocketWriterType, name?: string): void {
    it(`should transfer type ${typeof param}${name ? ` - ${name}` : ''}`, async () => {
        let topResolve: CallableFunction;
        let topReject: CallableFunction;
        const exchangePromise = new Promise((resolve, reject) => {
            topResolve = resolve;
            topReject = reject;
        });

        const port = await findFirstFreePort({ portRange: `>=${current_port}`, log: false, testConnection: true });

        const ipcServer = new IpcPacketSocket(); // '/tests'
        const timer = setTimeout(() => {
            ipcServer.server.close();
            topReject(new Error('timeout'));
        }, timeoutDelay + 10000);
        ipcServer.addListener('listening', () => {
            shouldLog && console.log(`Port ${port} : server listening`);
            const ipcSocket = new IpcPacketSocket();
            const closeSocket = () => {
                ipcSocket.socket.removeAllListeners();
                ipcSocket.socket.end();
                ipcSocket.socket.unref();
            };
            ipcSocket.addListener('packet', (ipcPacket) => {
                const paramResult = ipcPacket.parse();
                expect(paramResult).to.be.deep.equal(param);
                closeSocket();
                topResolve();
            });
            ipcSocket.addListener('timeout', (err) => {
                closeSocket();
                topReject(err);
            });
            ipcSocket.addListener('error', (err) => {
                shouldLog && console.log(`Port ${port} : ipcSocket error ${err}`);
                // We cannot reject as in some "cases" error fires after 'packet'
                // And we cannot close socket as it may not read the full packet data!
                // closeSocket();
                // topReject(err);
            });
            ipcSocket.connect(port);
        });
        ipcServer.addListener('connection', (socket) => {
            shouldLog && console.log(`Port ${port} : ipcSocket connected`);
            shouldLog && console.log(`Port ${port} : server sends data`);
            const ipb = new IpcPacketBuffer();
            switch (socketWriterType) {
                case SocketWriterType.Write:
                    socket.write(param);
                    break;
                case SocketWriterType.SerializeWrite:
                    ipb.serialize(param);
                    socket.write(ipb.buffer);
                    break;
                case SocketWriterType.SocketWriter:
                    ipb.write(new SocketWriter(socket), param);
                    break;
                case SocketWriterType.DelayedSocketWriter:
                    ipb.write(new DelayedSocketWriter(socket), param);
                    break;
                case SocketWriterType.BufferedSocketWriter:
                    ipb.write(new BufferedSocketWriter(socket, 64), param);
                    break;
            }
        });
        ipcServer.addListener('close', () => {
            shouldLog && console.log(`Port ${port} : server closed`);
        });
        ipcServer.addListener('error', (err) => {
            shouldLog && console.error(`Port ${port} : ${err}`);
            topReject(err);
        });
        ipcServer.listen(port);

        try {
            await exchangePromise;
        } finally {
            clearTimeout(timer);
            ipcServer.server.removeAllListeners();
            ipcServer.server.close((err) => {
                shouldLog && console.warn(`Port ${port} : ipcSocket close. Error ${err}`);
            });
        }
    });
}

[
    SocketWriterType.SocketWriter,
    SocketWriterType.DelayedSocketWriter,
    SocketWriterType.SerializeWrite,
    SocketWriterType.BufferedSocketWriter,
].forEach((socketWriterType) => {
    describe(`IpcPacketNetBuffer - ${SocketWriterType[socketWriterType]}`, async () => {
        function testSerialization(param: unknown, name?: string) {
            testSerializationWithSocket(param, socketWriterType, name);
        }

        describe('Serialize boolean', () => {
            const paramTrue = true;
            const paramFalse = false;

            testSerialization(paramTrue);
            testSerialization(paramFalse);
        });

        describe('Serialize string', () => {
            const paramString = 'this is a test';

            testSerialization(paramString);
        });

        describe('Serialize number', () => {
            const paramDouble = 12302.23;
            const paramInt32Positive = 45698;
            const paramInt32Negative = -45698;
            const paramInt64Positive = 99999999999999;
            const paramInt64Negative = -99999999999999;

            testSerialization(paramDouble);
            testSerialization(paramInt32Positive);
            testSerialization(paramInt32Negative);
            testSerialization(paramInt64Positive);
            testSerialization(paramInt64Negative);
        });

        const paramObject = {
            num: 10.2,
            str: 'test',
            bool: true,
            empty: null as null,
            properties: {
                num1: 12.2,
                str1: 'test2',
                strEmpty: '',
                bool1: false,
            },
        };
        const nullObject = null as null;

        describe('Serialize Object', () => {
            testSerialization(paramObject);
            testSerialization(nullObject);
        });

        describe('Serialize Array', () => {
            const paramArray = ['this is a test', '', 255, 56.5, null, true, '', paramObject, nullObject];

            testSerialization(paramArray);
        });

        describe('Serialize Buffer', () => {
            const paramBuffer = Buffer.alloc(128);
            for (let i = 0; i < paramBuffer.length; ++i) {
                paramBuffer[i] = 255 * Math.random();
            }

            const paramLongBuffer = Buffer.alloc(70000);
            for (let i = 0; i < 256; ++i) {
                paramLongBuffer[i] = 255 * Math.random();
            }

            testSerialization(paramBuffer, `Buffer of length ${paramBuffer.length} bytes`);
            testSerialization(paramLongBuffer, `Buffer of length ${paramLongBuffer.length} bytes`);
        });
    });
});
