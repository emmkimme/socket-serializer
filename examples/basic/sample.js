const portfinder = require('portfinder');

const ipbModule = require('../lib/ipcPacketBuffer');
const ipnModule = require('../lib/ipcPacketNet');


portfinder.getPortPromise({ port: 49152 }).then((port) => {
    let server = new ipnModule.IpcPacketNet({ port: port });
    server.addListener('listening', () => {
        let client = new ipnModule.IpcPacketNet({ port: port });
        client.addListener('packet', (ipcPacketBuffer) => {
            let paramObject = ipcPacketBuffer.toObject();
            console.log(JSON.stringify(paramObject));
        });
        client.addListener('error', (err) => {
        });
        client.connect();
    });
    server.addListener('connection', (socket) => {
        const paramObject = {
            num: 10.2,
            str: "test",
            bool: true
        };
        var ipb = ipbModule.fromObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen();
});
