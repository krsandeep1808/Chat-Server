const net = require('net');

class ChatServer {
  constructor() {
    this.clients = new Map();
    this.server = net.createServer();
    this.clientIdCounter = 0;
    this.port = process.env.PORT || 3000;
  }

  initialize() {
    this.server.on('connection', (socket) => {
      // Handle HTTP health checks from Render
      socket.once('data', (data) => {
        const dataStr = data.toString();
        if (dataStr.startsWith('GET') || dataStr.startsWith('HEAD')) {
          socket.write('HTTP/1.1 200 OK\r\n\r\n');
          socket.end();
          return;
        }

        // Regular chat connection
        this.handleChatConnection(socket, data);
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });

    // Handle server errors
    this.server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Keep alive for Render free tier
    setInterval(() => {
      console.log('Keep-alive ping');
      this.broadcast('ping');
    }, 4 * 60 * 1000); // 4 minutes
  }

  handleChatConnection(socket, initialData) {
    const clientId = ++this.clientIdCounter;
    this.clients.set(clientId, socket);
    console.log(`Client ${clientId} connected`);

    socket.setEncoding('utf8');
    
    // Send initial data if any
    if (initialData) {
      this.broadcast(`Client ${clientId}: ${initialData.toString().trim()}`, clientId);
    }

    // Handle incoming messages
    socket.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        console.log(`Client ${clientId}: ${message}`);
        this.broadcast(`Client ${clientId}: ${message}`, clientId);
      }
    });

    // Handle disconnection
    socket.on('end', () => {
      console.log(`Client ${clientId} disconnected`);
      this.clients.delete(clientId);
      this.broadcast(`Client ${clientId} left the chat`, clientId);
    });
  }

  broadcast(message, excludeClientId = null) {
    for (const [clientId, socket] of this.clients) {
      if (clientId !== excludeClientId && socket.writable) {
        socket.write(`${message}\n`);
      }
    }
  }

  start() {
    this.initialize();
    this.server.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new ChatServer();
  server.start();
}

module.exports = ChatServer;
