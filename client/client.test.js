const ChatClient = require('./client');
const net = require('net');
const { once } = require('events');

describe('ChatClient', () => {
    let testServer;
    const TEST_PORT = 3002;
    
    beforeAll(async () => {
        testServer = net.createServer();
        testServer.listen(TEST_PORT);
        await once(testServer, 'listening');
    });
    
    afterAll(async () => {
        testServer.close();
    });
    
    it('should connect to server', async () => {
        const client = new ChatClient('localhost', TEST_PORT);
        await client.connect();
        
        expect(client.socket).toBeDefined();
        
        // Don't call client.close() as it calls process.exit()
        client.socket.end();
        client.rl.close();
    });
    
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
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(serverMessages).toContain('Test message');
        expect(clientMessages).toContain('Message received');
        
        // Don't call client.close() as it calls process.exit()
        client.socket.end();
        client.rl.close();
    });
});