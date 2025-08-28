const express = require('express');
const cors = require('cors');
const billRoutes = require('./routes/billRoutes');

const app = express();

// Enable CORS for frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://profit-pilot-eight.vercel.app',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Use JSON body parser
app.use(express.json());

// Mount bills route
app.use('/api/bills', billRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'ProfitPilot backend is running' });
});

module.exports = app;
