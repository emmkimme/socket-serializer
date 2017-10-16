const portfinder = require('portfinder');

const ipbModule = require('../lib/ipcPacketBuffer');
const ipnModule = require('../lib/ipcPacketNet');

portfinder.getPortPromise({ port: 49152 }).then((port) => {
    let server = new ipnModule.IpcPacketNet({ port: port });
    server.addListener('listening', () => {
        let client = new ipnModule.IpcPacketNet({ port: port });
        client.addListener('packet', (ipcPacketBuffer) => {
            var ipb = new ipbModule.IpcPacketBuffer();
            let paramObject = ipb.parseObject();
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
        var ipb = new ipbModule.IpcPacketBuffer();
        ipb.serializeObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen();
});
