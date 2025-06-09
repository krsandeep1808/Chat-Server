# Chat-Sever

A simple chat server and client implementation using Node.js native sockets.


## Features

- 🚀 Real-time messaging between multiple clients
- 💻 Simple text-based interface
- 🌐 Network communication using native Node.js sockets
- ⚡ Event-driven architecture for handling multiple clients
- 🔌 Graceful connection handling and error management
- 🔒 Basic command system (/exit, /name)
- 🧪 Included test suite


## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v14 or higher recommended)
- npm (comes with Node.js)
- Terminal or command prompt
- For network connections between devices:
  - All devices must be on the same network
  - Firewall configured to allow connections on your chosen port


## Installation

Follow these steps to set up the chat application:

1. Clone the repository or download the source files:
```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Server

To start the chat server:
```bash
npm run start:server
# or
node server/server.js
```

By default, the server will listen on port 3000. You should see:
```
Server listening on port 3000
```

### Starting Clients

To start a chat client in a new terminal window:
```bash
npm run start:client
# or
node client/client.js
```

You'll be prompted to enter messages after seeing:
```
Connected to server as User_123  # Random username assigned
>
```

Start multiple clients in separate terminal windows to test group chatting.

### Client Commands

The client supports these special commands:
- `/exit` - Disconnect from the server
- `/name [newName]` - Change your display name


Example:
```
> /name Alice
Name changed to Alice
> Hello everyone!
> /exit
Disconnected from server
```

## Configuration

You can customize the application using environment variables:

| Variable   | Description                          | Default Value |
|------------|--------------------------------------|---------------|
| PORT       | Port the server listens on           | 3000          |
| HOST       | Server IP address clients connect to | localhost     |
| USERNAME   | Default client username              | Random number |

Examples:

Start server on port 4000:
```bash
PORT=4000 node server/server.js
```

Connect client to a server on another machine:
```bash
HOST=192.168.1.100 USERNAME=Bob node client/client.js
```



## Project Structure

```
chat-app/
├── server/               # Server implementation
│   ├── server.js         # Main server code
│   
├── client/               # Client implementation
│   ├── client.js         # Main client code
│   
├── package.json          # Project configuration
└── README.md            # This documentation
```

---

**Happy Chatting!** 💬
