const net = require('net');

const PORT = process.env.PORT || 3000;

let clientIdCounter = 0;
const clients = new Map(); // Store client sockets by ID

const server = net.createServer((socket) => {
    const clientId = ++clientIdCounter;
    clients.set(clientId, socket);

    console.log(`Client ${clientId} connected`);

    // Handle incoming messages
    socket.on('data', (data) => {
        const message = data.toString().trim();
        console.log(`Broadcasting: Client ${clientId}: ${message}`);

        // Broadcast to all other clients
        for (const [id, clientSocket] of clients.entries()) {
            if (id !== clientId) {
                clientSocket.write(`Client ${clientId}: ${message}\n`);
            }
        }
    });

    // Handle client disconnect (clean or abrupt)
    socket.on('close', () => {
        console.log(`Client ${clientId} disconnected`);
        clients.delete(clientId);
    });

    // Handle socket errors like ECONNRESET or EPIPE
    socket.on('error', (err) => {
        console.log(`Client ${clientId} error: ${err.message}`);
        socket.destroy(); // Ensure socket is fully closed
        clients.delete(clientId);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
