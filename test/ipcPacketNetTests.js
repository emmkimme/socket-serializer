const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

const portfinder = require('portfinder');

const Buffer = require('buffer').Buffer;
const ipbModule = require('../lib/ipcPacketBuffer');

const ipnModule = require('../lib/ipcPacketNet');

describe('Test server', function () {
    let server;
    let port;

    // beforeEach(function(done) {
    //     portfinder.getPortPromise({port: 49152}).then((thePort) => {
    //         port = thePort;
    //         server = new ipnModule.IpcPacketNet({ port: port });
    //         done();
    //   });
    // });

    it(`server listening`, function (done) {
        portfinder.getPortPromise({ port: 49152 }).then((thePort) => {
            port = thePort;
            server = new ipnModule.IpcPacketNet({ port: port }); '/tests'
            server.addListener('listening', () => {
                done();
            });
            server.addListener('error', (err) => {
                done(err);
            });
            server.listen();
        });
    });

    it(`client connecting`, function (done) {
        let client = new ipnModule.IpcPacketNet({ port: port });
        // const server = new ipnModule.IpcPacketNet({ socketPath: '/tests'});
        client.addListener('connect', () => {
            done();
        });
        client.addListener('error', (err) => {
            done(err);
        });
        client.connect();
    });
});

