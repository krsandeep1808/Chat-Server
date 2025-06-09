const net = require('net');
const { EventEmitter } = require('events');

class ChatServer extends EventEmitter {
    constructor(port) {
        super();
        this.port = port;
        this.clients = new Map();
        this.server = net.createServer();
        this.clientIdCounter = 0;
        
        this.setupServer();
    }
    
    setupServer() {
        this.server.on('connection', (socket) => {
            const clientId = ++this.clientIdCounter;
            this.clients.set(clientId, socket);
            this.emit('client-connected', clientId);
            
            socket.setEncoding('utf8');
            
            socket.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    this.emit('message', { clientId, message });
                }
            });
            
            socket.on('end', () => {
                this.removeClient(clientId);
            });
            
            socket.on('error', (err) => {
                console.error(`Client ${clientId} error:`, err.message);
                this.removeClient(clientId);
            });
        });
        
        this.server.on('error', (err) => {
            this.emit('server-error', err);
        });
    }
    
    removeClient(clientId) {
        if (this.clients.has(clientId)) {
            this.clients.delete(clientId);
            this.emit('client-disconnected', clientId);
        }
    }
    
    start() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, () => {
                this.emit('server-started', this.port);
                resolve(this.port);
            });
            
            this.server.once('error', reject);
        });
    }
    
    stop() {
        return new Promise((resolve) => {
            // Close all client connections
            for (const [clientId, socket] of this.clients) {
                socket.end();
            }
            this.clients.clear();
            
            // Close the server
            this.server.close(() => {
                this.emit('server-stopped');
                resolve();
            });
        });
    }
    
    // In your ClientManager or server code
broadcast(data, sender) {
  const failedClients = [];
  
  for (const client of this.clients) {
    if (client !== sender && client.writable) {
      try {
        client.write(data, (err) => {
          if (err) {
            console.error(`Failed to send to client: ${err.message}`);
            failedClients.push(client);
          }
        });
      } catch (err) {
        console.error(`Error sending to client: ${err.message}`);
        failedClients.push(client);
      }
    }
  }

  // Clean up failed clients
  failedClients.forEach(client => {
    this.clients.delete(client);
    client.destroy();
  });
}

// Main server execution
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const server = new ChatServer(PORT);
    
    // Event listeners for logging
    server.on('server-started', (port) => {
        console.log(`Server listening on port ${port}`);
    });
    
    server.on('client-connected', (clientId) => {
        console.log(`Client ${clientId} connected`);
        server.broadcast(`Client ${clientId} joined the chat`);
    });
    
    server.on('client-disconnected', (clientId) => {
        console.log(`Client ${clientId} disconnected`);
        server.broadcast(`Client ${clientId} left the chat`);
    });
    
    server.on('message', ({ clientId, message }) => {
        console.log(`Client ${clientId}: ${message}`);
        server.broadcast(`Client ${clientId}: ${message}`, clientId);
    });
    
    server.on('server-error', (error) => {
        console.error('Server error:', error.message);
    });
    
    // Start the server
    server.start().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down server...');
        await server.stop();
        process.exit();
    });
}

module.exports = ChatServer;
