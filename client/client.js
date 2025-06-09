const net = require('net');
const readline = require('readline');
const { EventEmitter } = require('events');

class ChatClient extends EventEmitter {
    constructor(host, port, username = 'User') {
        super();
        this.host = host;
        this.port = port;
        this.username = username;
        this.socket = new net.Socket();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.setupSocket();
    }
    
    setupSocket() {
        this.socket.setEncoding('utf8');
        
        this.socket.on('connect', () => {
            this.emit('connected');
            this.promptUser();
        });
        
        this.socket.on('data', (data) => {
            const message = data.toString().trim();
            if (message) {
                this.emit('message', message);
            }
        });
        
        this.socket.on('end', () => {
            this.emit('disconnected');
            this.close();
        });
        
        this.socket.on('error', (err) => {
            this.emit('error', err);
            this.close();
        });
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            this.socket.connect(this.port, this.host, () => {
                resolve();
            });
            
            this.socket.once('error', reject);
        });
    }
    
    send(message) {
        if (this.socket.writable) {
            this.socket.write(`${message}\n`);
            return true;
        }
        return false;
    }
    
    promptUser() {
        this.rl.question('> ', (message) => {
            if (message.toLowerCase() === '/exit') {
                return this.close();
            }
            
            if (this.send(message)) {
                this.promptUser();
            } else {
                console.log('Cannot send message - connection closed');
                this.close();
            }
        });
    }
    
    close() {
        if (this.socket) {
            this.socket.end();
        }
        this.rl.close();
        
        // Only call process.exit() when not in test environment
        if (process.env.NODE_ENV !== 'test') {
            process.exit();
        }
    }
}

// Main client execution
if (require.main === module) {
    const HOST = process.env.HOST || 'localhost';
    const PORT = process.env.PORT || 3000;
    const USERNAME = process.env.USERNAME || `User_${Math.floor(Math.random() * 1000)}`;
    
    const client = new ChatClient(HOST, PORT, USERNAME);
    
    // Event listeners for UI
    client.on('connected', () => {
        console.log(`Connected to server as ${USERNAME}`);
        client.send(`/name ${USERNAME}`);
    });
    
    client.on('message', (message) => {
        // Clear current line and write the received message
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(message);
        client.promptUser();
    });
    
    client.on('disconnected', () => {
        console.log('Disconnected from server');
    });
    
    client.on('error', (err) => {
        console.error('Connection error:', err.message);
    });
    
    // Connect to server
    client.connect().catch((err) => {
        console.error('Failed to connect:', err.message);
        process.exit(1);
    });
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
        client.close();
    });
}

module.exports = ChatClient;