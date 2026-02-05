require('dotenv').config();
const express = require('express');
const cors = require('cors');
const consultationRoutes = require('./routes/consultationRoutes');
const consumer = require('./rabbitmq/consumer');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize RabbitMQ Consumer
(async () => {
  await consumer.connect();
  await consumer.startConsuming();
})();

// Routes
app.use('/consultation', consultationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Consultation Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`Consultation Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Consultation Service...');
  server.close(async () => {
    await consumer.close();
    process.exit(0);
  });
});
