const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the project root
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Keep alive mechanism
app.listen(PORT, () => {
  console.log(`Simple test server running on http://localhost:${PORT}`);
  
  // Keep the process alive
  setInterval(() => {
    console.log('Server is alive at', new Date().toISOString());
  }, 30000);
});

// Prevent the process from exiting
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

console.log('Simple server script loaded');