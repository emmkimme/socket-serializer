import * as net from 'net';
import { IpcSocket } from './ipcSocket';
import { IpcPacketSocketDecoder } from './ipcPacketSocketDecoder';

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
    let ipcPacketDecoder = new IpcPacketSocketDecoder(this, socket, server);

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
