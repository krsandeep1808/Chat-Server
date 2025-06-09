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
    
    it('should start and stop', async () => {
        expect(server).toBeInstanceOf(ChatServer);
        expect(server.server.listening).toBeTruthy();
    });
    
    it('should handle client connections', async () => {
        const client = new net.Socket();
        client.connect(TEST_PORT);
        
        await once(server, 'client-connected');
        expect(server.clients.size).toBe(1);
        
        client.end();
        await once(server, 'client-disconnected');
        expect(server.clients.size).toBe(0);
    });
    
    it('should broadcast messages to all clients', async () => {
        const client1 = new net.Socket();
        const client2 = new net.Socket();
        
        // Set encoding for both clients
        client1.setEncoding('utf8');
        client2.setEncoding('utf8');
        
        const messages = [];
        const messagePromise = new Promise(resolve => {
            client2.on('data', (data) => {
                const msg = data.toString().trim();
                messages.push(msg);
                if (msg.includes('Test message')) {
                    resolve();
                }
            });
        });
        
        // Connect clients
        await new Promise(resolve => client1.connect(TEST_PORT, resolve));
        await new Promise(resolve => client2.connect(TEST_PORT, resolve));
        
        // Wait for both connections to be registered
        await once(server, 'client-connected');
        await once(server, 'client-connected');
        
        // Ensure server has both clients
        expect(server.clients.size).toBe(2);
        
        // Send message from client1
        client1.write('Test message\n');
        
        // Wait for message to be received with longer timeout
        await Promise.race([
            messagePromise,
            new Promise((_, reject) => setTimeout(
                () => reject(new Error('Timeout waiting for message')), 
                1000 // Increased timeout
            ))
        ]);
        
        expect(messages).toContain('Test message');
        
        // Clean up
        client1.end();
        client2.end();
    });
    
    it('should not broadcast to sender', async () => {
        const client1 = new net.Socket();
        const client2 = new net.Socket();
        
        // Set encoding for both clients
        client1.setEncoding('utf8');
        client2.setEncoding('utf8');
        
        const client1Messages = [];
        const client2Messages = [];
        
        client1.on('data', (data) => client1Messages.push(data.toString().trim()));
        client2.on('data', (data) => client2Messages.push(data.toString().trim()));
        
        // Connect clients
        await new Promise(resolve => client1.connect(TEST_PORT, resolve));
        await new Promise(resolve => client2.connect(TEST_PORT, resolve));
        
        // Wait for both connections
        await once(server, 'client-connected');
        await once(server, 'client-connected');
        
        // Ensure server has both clients
        expect(server.clients.size).toBe(2);
        
        // Send message from client1
        client1.write('Test message\n');
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Verify
        expect(client2Messages).toContain('Test message');
        expect(client1Messages).not.toContain('Test message');
        
        // Clean up
        client1.end();
        client2.end();
    });
});