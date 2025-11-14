const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const os = require('os');

const app = express();
const allowAllCors = process.env.NODE_ENV !== 'production' || process.env.ALLOW_ALL_CORS === '1';
const allowedHosts = new Set(['127.0.0.1', 'localhost', '::1']);

if (process.env.DEV_LAN_IP) allowedHosts.add(process.env.DEV_LAN_IP);

try {
    const nets = os.networkInterfaces();
    Object.values(nets).forEach(entries => {
        (entries || []).forEach(info => {
            if (!info || info.internal) return;
            if ((info.family === 'IPv4' || info.family === 4) && info.address) {
                allowedHosts.add(info.address);
            }
        });
    });
} catch (err) {
    console.warn('Failed to enumerate network interfaces for CORS whitelist', err);
}

const isOriginAllowed = (origin) => {
    if (!origin) return allowAllCors;
    if (allowAllCors) return true;
    try {
        const parsed = new URL(origin);
        if (!['http:', 'https:'].includes(parsed.protocol)) return false;
        return allowedHosts.has(parsed.hostname);
    } catch (err) {
        return false;
    }
};

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (isOriginAllowed(origin)) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && isOriginAllowed(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    }
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Check if SSL certificates exist
const certPath = path.join(__dirname, 'localhost.pem');
const keyPath = path.join(__dirname, 'localhost-key.pem');
const useHTTPS = fs.existsSync(certPath) && fs.existsSync(keyPath);

let server;
if (useHTTPS) {
    const httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    server = https.createServer(httpsOptions, app);
    console.log('🔒 Using HTTPS');
} else {
    server = http.createServer(app);
    console.log('⚠️  Using HTTP (WebXR requires HTTPS for Quest)');
    console.log('   Run: npm install -g mkcert');
    console.log('   Then: mkcert localhost 192.168.1.89');
}

const io = socketIO(server);

const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API to list available rooms (scans public/Rooms/* for .gltf/.glb)
app.get('/api/rooms', (req, res) => {
    const roomsDir = path.join(__dirname, 'public', 'Rooms');
    try {
        if (!fs.existsSync(roomsDir)) {
            return res.json([]);
        }
        const entries = fs.readdirSync(roomsDir, { withFileTypes: true });
        const rooms = [];
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const dir = path.join(roomsDir, entry.name);
            const files = fs.readdirSync(dir);
            // Try to find a primary scene file
            const sceneFile = files.find(f => /\.gltf$/i.test(f)) || files.find(f => /\.glb$/i.test(f));
            if (sceneFile) {
                rooms.push({
                    id: entry.name,
                    name: entry.name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                    scene: `Rooms/${entry.name}/${sceneFile}`
                });
            }
        }
        res.json(rooms);
    } catch (e) {
        console.error('Error listing rooms:', e);
        res.status(500).json({ error: 'failed_to_list_rooms' });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle user joining a room
    socket.on('joinRoom', (roomId, userData) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        
        // Notify others in the room
        socket.to(roomId).emit('userJoined', {
            userId: socket.id,
            timestamp: Date.now(),
            user: userData || null
        });
    });

    // Handle position updates
    socket.on('updatePosition', (data) => {
        socket.to(data.roomId).emit('userMoved', {
            userId: socket.id,
            position: data.position,
            rotation: data.rotation
        });
    });

    // Handle hand tracking updates
    socket.on('updateHands', (data) => {
        socket.to(data.roomId).emit('handsUpdated', {
            userId: socket.id,
            leftHand: data.leftHand,
            rightHand: data.rightHand
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Broadcast to all rooms that user left
        socket.broadcast.emit('userLeft', socket.id);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const protocol = useHTTPS ? 'https' : 'http';
    console.log(`VR Social Platform server running on port ${PORT}`);
    console.log(`Local:   ${protocol}://localhost:${PORT}`);
    console.log(`Network: ${protocol}://192.168.1.89:${PORT}`);
    if (!useHTTPS) {
        console.log('\n⚠️  WebXR requires HTTPS! To enable:');
        console.log('   npx mkcert create-ca');
        console.log('   npx mkcert create-cert');
    }
});
