const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
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

server.listen(PORT, () => {
    console.log(`VR Social Platform server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});
