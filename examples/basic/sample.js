const socketHelpers = require('socket-port-helpers');
const socketSerialModule = require('socket-serializer');

let port = 49152;
socketHelpers.findFirstFreePort({portRange: `>=${port}`, log: false, testConnection: true })
.then((port) => {
    let server = new socketSerialModule.IpcPacketSocket();
    server.addListener('listening', () => {
        let client = new socketSerialModule.IpcPacketSocket();
        client.addListener('packet', (ipcPacketBuffer) => {
            let paramObject = ipcPacketBuffer.parseObject();
            console.log(JSON.stringify(paramObject));
        });
        client.addListener('error', (err) => {
        });
        client.connect(port);
    });
    server.addListener('connection', (socket) => {
        const paramObject = {
            num: 10.2,
            str: "test",
            bool: true,
            array: ["", 10.2, true]
        };
        var ipb = new socketSerialModule.IpcPacketBuffer();
        ipb.serializeObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen(port);
});
