const net = require('net');
const readline = require('readline');

class ChatClient {
  constructor() {
    this.host = process.env.HOST || 'your-render-app.onrender.com';
    this.port = process.env.PORT || 443;
    this.username = process.env.USERNAME || `User_${Math.floor(Math.random() * 1000)}`;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  connect() {
    this.socket = net.createConnection({
      host: this.host,
      port: this.port,
      tls: false // Important for TCP over Render
    }, () => {
      console.log(`Connected to server as ${this.username}`);
      this.promptUser();
      this.send(`/name ${this.username}`);
    });

    this.socket.setEncoding('utf8');

    this.socket.on('data', (data) => {
      this.displayMessage(data.toString().trim());
    });

    this.socket.on('end', () => {
      console.log('Disconnected from server');
      process.exit();
    });

    this.socket.on('error', (err) => {
      console.error('Connection error:', err);
      process.exit(1);
    });
  }

  displayMessage(message) {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    console.log(message);
    this.promptUser();
  }

  promptUser() {
    this.rl.question('> ', (message) => {
      if (message.toLowerCase() === '/exit') {
        this.socket.end();
        this.rl.close();
        return;
      }
      this.send(message);
      this.promptUser();
    });
  }

  send(message) {
    if (this.socket && this.socket.writable) {
      this.socket.write(`${message}\n`);
      return true;
    }
    console.log('Cannot send message - connection closed');
    return false;
  }
}

// Start the client if this file is run directly
if (require.main === module) {
  const client = new ChatClient();
  client.connect();

  process.on('SIGINT', () => {
    client.socket.end();
    client.rl.close();
  });
}

module.exports = ChatClient;
