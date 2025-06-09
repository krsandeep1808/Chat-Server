const ChatClient = require('./client');
const net = require('net');
const { once } = require('events');

describe('ChatClient', () => {
    let testServer;
    const TEST_PORT = 3002;
    
    beforeAll(async () => {
        testServer = net.createServer();
        await new Promise((resolve) => {
            testServer.listen(TEST_PORT, resolve);
        });
    });
    
    afterAll(async () => {
        await new Promise((resolve) => {
            testServer.close(resolve);
        });
    });
    
    it('should connect to server', async () => {
        const client = new ChatClient('localhost', TEST_PORT);
        await client.connect();
        
        expect(client.socket).toBeDefined();
        client.close();
    }, 10000);
    
    it('should send and receive messages', async () => {
        const serverMessages = [];
        testServer.on('connection', (socket) => {
            socket.on('data', (data) => {
                serverMessages.push(data.toString().trim());
                socket.write('Message received\n');
            });
        });
        
        const client = new ChatClient('localhost', TEST_PORT);
        await client.connect();
        
        const clientMessages = [];
        client.on('message', (msg) => clientMessages.push(msg));
        
        client.send('Test message');
        
        // Wait for message roundtrip
        await new Promise(resolve => setTimeout(resolve, 500));
        
        expect(serverMessages).toContain('Test message');
        expect(clientMessages).toContain('Message received');
        
        client.close();
    }, 10000);
});