require("dotenv").config();
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Validate critical env vars early so errors are obvious
const requiredEnvs = ['MONGO_URI', 'JWT_SECRET', 'GOOGLE_CLIENT_ID'];
const missing = requiredEnvs.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Create a backend/.env file (copy .env.example) and provide these values.');
  // Exit early to avoid runtime exceptions like "secretOrPrivateKey must have a value"
  process.exit(1);
}

// Connect DB
connectDB();

const app = express();

// Middleware
app.use(express.json());
// Configure helmet so Google Identity popups/postMessage are not blocked by strict COOP
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const CLIENT_URL = process.env.CLIENT_URL || '*';
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('🚀 PPStack Backend - OK'));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
