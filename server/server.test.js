const ChatServer = require('./server');
const net = require('net');
const { once } = require('events');

describe('ChatServer', () => {
    let server;
    const TEST_PORT = 3001;
    
    beforeEach(async () => {
        server = new ChatServer(TEST_PORT);
        await server.start();
    });
    
    afterEach(async () => {
        await server.stop();
    });
    
    it('should broadcast messages to all clients', async () => {
        const client1 = new net.Socket();
        const client2 = new net.Socket();
        
        // Connect clients first
        client1.connect(TEST_PORT);
        client2.connect(TEST_PORT);
        
        // Wait for both connections to be established
        await new Promise(resolve => {
            let connectedCount = 0;
            const checkConnections = () => {
                connectedCount++;
                if (connectedCount === 2) resolve();
            };
            
            server.on('client-connected', checkConnections);
        });
        
        // Get client IDs
        const clientIds = Array.from(server.clients.keys());
        const [client1Id, client2Id] = clientIds;
        
        // Set up message collection
        const receivedMessages = [];
        const messagePromise = new Promise(resolve => {
            client2.on('data', (data) => {
                const msg = data.toString().trim();
                receivedMessages.push(msg);
                if (msg.includes('Hello from client1')) {
                    resolve();
                }
            });
        });
        
        // Send test message
        client1.write('Hello from client1\n');
        
        // Wait for message to be processed
        await Promise.race([
            messagePromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for message')), 2000))
        ]);
        
        // Verify the message
        expect(receivedMessages).toContain(`Client ${client1Id}: Hello from client1`);
        
        // Clean up
        client1.end();
        client2.end();
    }, 10000);
    
    it('should not broadcast to sender', async () => {
        const client1 = new net.Socket();
        const client2 = new net.Socket();
        
        // Connect clients first
        client1.connect(TEST_PORT);
        client2.connect(TEST_PORT);
        
        // Wait for both connections
        await new Promise(resolve => {
            let connectedCount = 0;
            const checkConnections = () => {
                connectedCount++;
                if (connectedCount === 2) resolve();
            };
            
            server.on('client-connected', checkConnections);
        });
        
        // Get client IDs
        const clientIds = Array.from(server.clients.keys());
        const [client1Id, client2Id] = clientIds;
        
        // Set up message collection
        const client1Messages = [];
        const client2Messages = [];
        
        const client2Promise = new Promise(resolve => {
            client2.on('data', (data) => {
                const msg = data.toString().trim();
                client2Messages.push(msg);
                if (msg.includes('Hello from client1')) {
                    resolve();
                }
            });
        });
        
        // Monitor client1
        client1.on('data', (data) => {
            client1Messages.push(data.toString().trim());
        });
        
        // Send test message
        client1.write('Hello from client1\n');
        
        // Wait for message to be processed
        await Promise.race([
            client2Promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for message')), 2000))
        ]);
        
        // Verify results
        expect(client1Messages).not.toContain(`Client ${client1Id}: Hello from client1`);
        expect(client2Messages).toContain(`Client ${client1Id}: Hello from client1`);
        
        // Clean up
        client1.end();
        client2.end();
    }, 10000);
});