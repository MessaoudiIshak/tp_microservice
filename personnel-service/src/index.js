require('dotenv').config();
const express = require('express');
const cors = require('cors');
const doctorRoutes = require('./routes/doctorRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/personnel', doctorRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Personnel Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Personnel Service running on port ${PORT}`);
});
