console.log('=== Test Script Starting ===');
console.log('Node version:', process.version);
console.log('Current directory:', __dirname);

try {
    const express = require('express');
    console.log('✓ Express loaded successfully');
    
    const app = express();
    const PORT = 8080;
    
    app.get('/', (req, res) => {
        res.send('Test server is working!');
    });
    
    const server = app.listen(PORT, () => {
        console.log(`✓ Test server listening on http://localhost:${PORT}`);
        console.log('=== Server started successfully ===');
    });
    
    server.on('error', (err) => {
        console.error('✗ Server error:', err.message);
        process.exit(1);
    });
    
} catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
}
