import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import appointmentRoutes from './routes/appointments';
import aiRoutes from './routes/ai';
import postDischargeRoutes from './routes/postDischarge';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join video call room
  socket.on('join-call', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Handle video call signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  // Handle AI chat messages
  socket.on('ai-message', async (data) => {
    try {
      // Process AI message here
      const response = await processAIMessage(data.message);
      socket.emit('ai-response', { message: response });
    } catch (error) {
      socket.emit('ai-error', { error: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// AI message processing function
async function processAIMessage(message: string): Promise<string> {
  // This is a placeholder - in production, you'd integrate with an AI service
  const responses = [
    "I understand your concern. Let me help you with that.",
    "Based on your symptoms, I recommend consulting with a healthcare provider.",
    "That's a common condition. Here are some general guidelines...",
    "I can provide general health information, but for specific medical advice, please consult a doctor.",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/appointments', authenticateToken, appointmentRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/post-discharge', authenticateToken, postDischargeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'IFFAHEALTH API',
    version: '1.0.0',
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 IFFAHEALTH API Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export { io };
export default app;
