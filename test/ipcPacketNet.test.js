const socketHelpers = require('socket-port-helpers');
const ssbModule = require('..');

describe('Test server', function () {
    let port;
    it(`server listening`, function (done) {
        socketHelpers.findFirstFreePort({portRange: `>=49152`, log: false, testConnection: true })
        .then((thePort) => {
            port = thePort;
            let server = new ssbModule.IpcPacketSocket();
            server.addListener('connection', () => {
                // server.server.close();
            });
            server.addListener('listening', () => {
                done();
            });
            server.addListener('error', (err) => {
                done(err);
            });
            server.listen(port);
        })
        .catch((err) => {
            done(err);
        });
    });

    it(`client connecting`, function (done) {
        let client = new ssbModule.IpcPacketSocket();
        client.addListener('connect', (socket) => {
            // client.socket.end();
            done();
        });
        client.addListener('error', (err) => {
            done(err);
        });
        client.connect(port);
    });
});

