const net = require('net');
const readline = require('readline');
const chalk = require('chalk');

// Custom simple chalk-like implementation since we can't use external libs
const colors = {
    red: text => `\x1b[31m${text}\x1b[0m`,
    green: text => `\x1b[32m${text}\x1b[0m`,
    yellow: text => `\x1b[33m${text}\x1b[0m`,
    blue: text => `\x1b[34m${text}\x1b[0m`,
    magenta: text => `\x1b[35m${text}\x1b[0m`,
    cyan: text => `\x1b[36m${text}\x1b[0m`,
    gray: text => `\x1b[90m${text}\x1b[0m`,
};

class EnhancedChatClient {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = new net.Socket();
        this.username = null;
        this.usernameSet = false;
        
        this.setupInterface();
        this.connectToServer();
    }
    
    setupInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        // Handle CTRL+C gracefully
        this.rl.on('close', () => {
            console.log(colors.yellow('\nDisconnecting...'));
            this.socket.end();
            process.exit(0);
        });
    }
    
    connectToServer() {
        this.socket.connect(this.port, this.host, () => {
            console.log(colors.green('Connected to chat server'));
            console.log(colors.cyan('Enter your username:'));
        });
        
        this.socket.on('data', (data) => {
            this.clearInputLine();
            process.stdout.write(data.toString());
            this.promptForMessage();
        });
        
        this.socket.on('close', () => {
            console.log(colors.yellow('\nDisconnected from server'));
            process.exit(0);
        });
        
        this.socket.on('error', (err) => {
            console.error(colors.red('Connection error:'), err);
            process.exit(1);
        });
    }
    
    clearInputLine() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }
    
    promptForMessage() {
        this.rl.question('> ', (message) => {
            if (!this.usernameSet && message.trim()) {
                this.username = message.trim();
                this.usernameSet = true;
                console.log(colors.cyan(`You are now known as ${this.username}`));
            }
            this.socket.write(message);
            this.promptForMessage();
        });
    }
}

// Start the enhanced client
const HOST = 'localhost';
const PORT = 3000;
const chatClient = new EnhancedChatClient(HOST, PORT);
