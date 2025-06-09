const net = require('net');
const http = require('http');

// TCP Chat Server
let clientIdCounter = 0;
const clients = new Map();

const tcpServer = net.createServer((socket) => {
    const clientId = ++clientIdCounter;
    clients.set(clientId, socket);

    console.log(`Client ${clientId} connected`);

    socket.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`Broadcasting: Client ${clientId}: ${message}`);

        for (const [id, clientSocket] of clients.entries()) {
            if (id !== clientId) {
                clientSocket.write(`Client ${clientId}: ${message}\n`);
            }
        }
    });

    socket.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients.delete(clientId);
    });

    socket.on('error', (err) => {
        console.log(`Client ${clientId} error: ${err.message}`);
        socket.destroy();
        clients.delete(clientId);
    });
});

const TCP_PORT = process.env.TCP_PORT || 10000;
tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
});

// Dummy HTTP server to satisfy Render
const HTTP_PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Chat server is running.\n");
}).listen(HTTP_PORT, () => {
    console.log(`HTTP server running on port ${HTTP_PORT}`);
});
