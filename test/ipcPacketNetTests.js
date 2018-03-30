const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const portfinder = require('portfinder');

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/code/ipcPacketBuffer');

const ipnModule = require('../lib/code/ipcPacketNet');

describe('Test server', function () {
    let port;
    it(`server listening`, function (done) {
        portfinder.getPortPromise({ port: 49152 })
        .then((thePort) => {
            port = thePort;
            let server = new ipnModule.IpcPacketNet();
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
        let client = new ipnModule.IpcPacketNet();
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

