import * as net from 'net';
// import * as util from 'util';
// import { EventEmitter } from 'events';
import { IpcSocket } from './ipcSocket';
import { IpcPacketBufferDecoder } from './ipcPacketBufferDecoder';
// import { IpcPacketBuffer } from './ipcPacketBuffer';

export class IpcPacketSocket extends IpcSocket {
  constructor(options?: any) {
    super(options);
  }

  //   on(event: 'packet', handler: (packet: IpcPacketBuffer, socket: net.Socket, server?: net.Server) => void): this;
  //   on(event: 'packets', handler: (packets: IpcPacketBuffer[], socket: net.Socket, server?: net.Server) => void): this;
  //   on(event: string, handler: Function): this {
  //     return super.on(event, handler);
  //   }

  protected _parseStream(socket: net.Socket, server?: net.Server) {
    let ipcPacketDecoder = new IpcPacketBufferDecoder(this, socket, server);

    function handleData(buffer: Buffer) {
      ipcPacketDecoder.handleData(buffer);
    }

    socket.on('close', (had_error: any) => {
      socket.removeListener('data', handleData);
      ipcPacketDecoder = null;
    });
    socket.addListener('data', handleData);
  }

}
