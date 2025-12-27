require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");

// ======================
// Validate env variables
// ======================
const requiredEnvs = [
  "MONGO_URI",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CLIENT_URL",
];

const missing = requiredEnvs.filter((key) => !process.env[key]);
if (missing.length) {
  console.error("❌ Missing required environment variables:", missing.join(", "));
  process.exit(1);
}

// ======================
// Connect Database
// ======================
connectDB();

const app = express();

// ======================
// Core Middleware (ORDER MATTERS)
// ======================
app.use(express.json());

// Helmet config (needed for Google popup)
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ======================
// ✅ CORS CONFIG (IMPORTANT)
// ======================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://ppstack.vercel.app", // frontend URL (use CLIENT_URL env in production)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
app.options("*", cors());

// ======================
// Routes
// ======================
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("🚀 PPStack Backend is running");
});

// ======================
// Error Handlers
// ======================
app.use(notFound);
app.use(errorHandler);

// ======================
// Start Server
// ======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
