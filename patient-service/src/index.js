require('dotenv').config();
const express = require('express');
const cors = require('cors');
const patientRoutes = require('./routes/patientRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/patients', patientRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Patient Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Patient Service running on port ${PORT}`);
});
