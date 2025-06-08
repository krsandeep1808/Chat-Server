const net = require('net');
const { randomUUID } = require('crypto');

class EnhancedChatServer {
    constructor(port) {
        this.port = port;
        this.clients = new Map(); // Map of socket to client info
        this.server = net.createServer();
        
        this.setupServer();
    }
    
    setupServer() {
        this.server.on('connection', (socket) => {
            const clientId = randomUUID().slice(0, 8);
            this.handleNewConnection(socket, clientId);
        });
        
        this.server.on('error', (err) => {
            console.error('\x1b[31mServer error:\x1b[0m', err);
        });
    }
    
    handleNewConnection(socket, clientId) {
        // Set initial client data (username assigned after first message)
        this.clients.set(socket, { id: clientId, username: `User-${clientId}` });
        
        console.log(`\x1b[32mNew connection (${this.clients.size} total)\x1b[0m`);
        
        // Send welcome message
        socket.write('\x1b[36mWelcome to the chat! Enter your username:\x1b[0m\n');
        
        // Set up event handlers
        socket.on('data', (data) => {
            const clientData = this.clients.get(socket);
            const message = data.toString().trim();
            
            // First message is treated as username
            if (!clientData.usernameSet) {
                clientData.username = message || clientData.username;
                clientData.usernameSet = true;
                this.broadcast(`\x1b[33m${clientData.username} joined the chat\x1b[0m\n`, socket);
                socket.write(`\x1b[36mYou are now known as ${clientData.username}\x1b[0m\n`);
            } else {
                this.broadcast(`\x1b[35m${clientData.username}:\x1b[0m ${message}\n`, socket);
            }
        });
        
        socket.on('end', () => {
            const clientData = this.clients.get(socket);
            if (clientData?.usernameSet) {
                this.broadcast(`\x1b[33m${clientData.username} left the chat\x1b[0m\n`, socket);
            }
            this.clients.delete(socket);
            console.log(`\x1b[31mClient disconnected (${this.clients.size} remaining)\x1b[0m`);
        });
        
        socket.on('error', (err) => {
            console.error('\x1b[31mClient socket error:\x1b[0m', err);
            this.clients.delete(socket);
        });
    }
    
    broadcast(message, sender) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `\x1b[90m[${timestamp}]\x1b[0m ${message}`;
        
        for (const [client, _] of this.clients) {
            if (client !== sender && client.writable) {
                client.write(formattedMessage);
            }
        }
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`\x1b[32mServer listening on port ${this.port}\x1b[0m`);
            console.log('\x1b[36mWaiting for connections...\x1b[0m');
        });
    }
}

// Start the enhanced server
const PORT = 3000;
const chatServer = new EnhancedChatServer(PORT);
chatServer.start();
