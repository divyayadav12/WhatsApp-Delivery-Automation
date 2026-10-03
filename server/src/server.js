const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io for real-time live progress updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts/styles in dev if needed
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Mount API routes
app.use('/api', apiRoutes);

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log(`[SOCKET] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[SOCKET] Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB with in-memory fallback if local DB is not accessible
async function startDatabase() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fast_whatsapp_automation';
  
  try {
    console.log(`[DB] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    console.log('[DB] MongoDB connected successfully.');
  } catch (err) {
    console.warn(`[DB] Direct MongoDB connection failed: ${err.message}. Starting fallback In-Memory MongoDB...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      console.log(`[DB] Connected to In-Memory MongoDB at ${memoryUri}`);
      await mongoose.connect(memoryUri);
    } catch (memErr) {
      console.error('[DB FATAL] Could not connect to any MongoDB instance:', memErr.message);
    }
  }
}

// Start server
if (process.env.NODE_ENV !== 'test') {
  startDatabase().then(() => {
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  FAST Education — WhatsApp Delivery Automation Server`);
      console.log(`  Server running on: http://localhost:${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  });
}

module.exports = { app, server };
