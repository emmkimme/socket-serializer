import * as net from 'net';
// import * as util from 'util';
import { EventEmitter } from 'events';

export class IpcNet extends EventEmitter {
  private _defaultHost: string;

  private _reconnect: boolean;
  private _delayReconnect: number;

  private _numReconnects: number;

  private _socket: net.Socket;
  private _server: net.Server;

  constructor(options?: any) {
    super();

    options = options || {};

    this._defaultHost = options.host || 'localhost';

    this._numReconnects = 0;
    this._reconnect = options.reconnect || true;
    this._delayReconnect = options.delayReconnect || 3000;
  }

  get socket(): net.Socket {
    return this._socket;
  }

  get server(): net.Server {
    return this._server;
  }

  // on(event: 'connect', handler: (socket: net.Socket) => void): this;
  // on(event: 'reconnect', handler: (socket: net.Socket) => void): this;
  // on(event: 'connection', handler: (socket: net.Socket, server: net.Server) => void): this;
  // on(event: 'listening', handler: (server: net.Server) => void): this;
  // on(event: 'close', handler: (had_error: boolean, socket: net.Socket, server?: net.Server) => void): this;
  // on(event: 'error', handler: (err: NodeJS.ErrnoException) => void): this;
  // on(event: 'warn', handler: (err: Error) => void): this;
  // on(event: 'data', handler: (buffer: Buffer, socket: net.Socket, server?: net.Server) => void): this;
  // on(event: string, handler: Function): this {
  //   return super.on(event, handler);
  // }

  private _onSocketConnect(socket: net.Socket, portOrPath: any, host: string): void {
    socket.removeAllListeners('error');

    this._parseStream(socket);

    socket.on('close', (had_error: any) => {
      this.emit('close', had_error, socket);

      // reconnect
      if (this._reconnect) {
        this.reconnect(portOrPath, host);
      }
    });

    if (this._numReconnects > 0) {
      this.emit('reconnect', socket);
      this._numReconnects = 0;
    }
    else {
      this.emit('connect', socket);
    }
  }

  private _onSocketError(socket: net.Socket, err: NodeJS.ErrnoException, portOrPath: any, host: string): void {
    socket.removeAllListeners('connect');

    if ((err.code === 'ECONNREFUSED') && this._numReconnects) {
      this.emit('warn', new Error(err.code + ' on ' + portOrPath + ', ' + host));
      return this.reconnect(portOrPath, host);
    }
    this.emit('error', err, socket);
  }

  connect(portOrPath: any, host?: string) {
    host = host || (!isNaN(portOrPath) ? this._defaultHost : null);

    if (portOrPath && host) {
      this._socket = net.connect(portOrPath, host);
    }
    else {
      this._socket = net.connect(portOrPath);
    }

    this._socket.once('error', (err: NodeJS.ErrnoException) => {
      this._onSocketError(this._socket, err, portOrPath, host);
    });
    this._socket.once('connect', () => {
      this._onSocketConnect(this._socket, portOrPath, host);
    });
  }

  private reconnect(portOrPath: any, host: string) {
    this._numReconnects += 1;
    if (this._delayReconnect) {
      setTimeout(() => {
        this.connect(portOrPath, host);
      }, this._delayReconnect);
    }
    else {
      this.connect(portOrPath, host);
    }
  }

  private _onServerError(server: net.Server, err: NodeJS.ErrnoException, portOrPath: any, host: string): void {
    this.emit('error', err, server);
  }

  private _onServerConnection(socket: net.Socket, server: net.Server): void {
    this._parseStream(socket, server);

    socket.on('close', (had_error: boolean) => {
      this.emit('close', had_error, socket, server);
    });

    this.emit('connection', socket, server);
  }

  private _onServerListening(server: net.Server): void {
    server.removeAllListeners('error');
    this.emit('listening', server);
  };

  listen(portOrPath: any, host?: string) {
    host = host || (!isNaN(portOrPath) ? this._defaultHost : null);

    this._server = net.createServer();

    this._server.once('error', (err: NodeJS.ErrnoException) => {
      this._onServerError(this._server, err, portOrPath, host);
    });
    this._server.once('listening', () => {
      this._onServerListening(this._server);
    });
    this._server.on('connection', (socket) => {
      this._onServerConnection(socket, this._server);
    });

    if (portOrPath && host) {
      this._server.listen(portOrPath, host);
    }
    else {
      this._server.listen(portOrPath);
    }
  }

  // start(portOrPath: any, host?: any) {
  //   host = host || (!isNaN(port) ? this._defaultHost : null);

  //   let onError = (err: any): void => {
  //     if (err.code === 'ECONNREFUSED') {
  //       this.emit('warn', new Error(err.code + ' on ' + port + ', ' + host));
  //       this.listen(port, host);
  //     }
  //     else {
  //       this.removeAllListeners('listening');
  //       this.removeAllListeners('connection');
  //       this.removeAllListeners('connect');
  //       this.emit('error', err);
  //     }
  //   };

  //   let onListening = (server: net.Server): void => {
  //     this.removeAllListeners('error');
  //     this.removeAllListeners('connection');
  //     this.removeAllListeners('connect');
  //   };

  //   let onConnection = (socket: net.Socket, server: net.Server): void => {
  //     this.removeAllListeners('error');
  //     this.removeListener('listening', onListening);
  //     this.removeListener('connect', onConnect);
  //   };

  //   let onConnect = (socket: net.Socket): void => {
  //     this.removeListener('error', onError);
  //     this.removeAllListeners('listening');
  //     this.removeAllListeners('connect');
  //   };

  //   this.once('error', (err: any) => onError(err));
  //   this.once('listening', (server: net.Server) => onListening(server));
  //   this.once('connection', (socket: net.Socket, server: net.Server) => onConnection(socket, server));
  //   this.once('connect', (socket: net.Socket) => onConnect(socket));

  //   this.connect(port, host);
  // }

  protected _parseStream(socket: net.Socket, server?: net.Server) {
    socket.on('data', (buffer: Buffer) => {
        this.emit('data', buffer, socket, server);
    });
  }
}
