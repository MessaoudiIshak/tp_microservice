require('dotenv').config();
const express = require('express');
const cors = require('cors');
const appointmentRoutes = require('./routes/appointmentRoutes');
const publisher = require('./rabbitmq/publisher');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize RabbitMQ Publisher
publisher.connect();

// Routes
app.use('/planning', appointmentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Planning Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Planning Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Planning Service...');
  server.close(async () => {
    await publisher.close();
    process.exit(0);
  });
});
