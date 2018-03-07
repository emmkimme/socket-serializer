const portfinder = require('portfinder');

const socketSerialModule = require('socket-serializer');

portfinder.getPortPromise({ port: 49152 }).then((port) => {
    let server = new socketSerialModule.IpcPacketNet({ port: port });
    server.addListener('listening', () => {
        let client = new socketSerialModule.IpcPacketNet({ port: port });
        client.addListener('packet', (ipcPacketBuffer) => {
            let paramObject = ipcPacketBuffer.parseObject();
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
            bool: true,
            array: ["", 10.2, true]
        };
        var ipb = new socketSerialModule.IpcPacketBuffer();
        ipb.serializeObject(paramObject);
        socket.write(ipb.buffer);
    });
    server.addListener('error', (err) => {
    });
    server.listen();
});
