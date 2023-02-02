import { findFirstFreePort } from 'socket-port-helpers';
import { IpcPacketSocket } from '../../src/socket/ipcPacketSocket';

describe('IpcPacketSocket server', () => {
    let port: number;
    let server: IpcPacketSocket;

    after(() => {
        server.server.removeAllListeners();
        server.server.close();
    });

    it(`should start server listening`, async () => {
        port = await findFirstFreePort({ portRange: `>=49152`, log: false, testConnection: true });
        server = new IpcPacketSocket();
        return new Promise((resolve, reject) => {
            server.addListener('listening', () => {
                resolve();
            });
            server.addListener('error', (err) => {
                reject(err);
            });
            server.listen(port);
        });
    });

    it(`should connect client`, (done) => {
        const client = new IpcPacketSocket();
        const closeSocket = () => {
            client.socket.end();
            client.socket.removeAllListeners();
        };
        client.addListener('connect', () => {
            closeSocket();
            done();
        });
        client.addListener('error', (err) => {
            closeSocket();
            done(err);
        });
        client.connect(port);
    });
});
