require("dotenv").config();

const dns = require("dns");

// MongoDB Atlas DNS fix
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

// Database
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const queueRoutes = require("./routes/queueRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");

// Socket
const queueSocket = require("./sockets/queueSocket");

const app = express();


// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    credentials: true,
  })
);


// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json());


// =====================================================
// DATABASE
// =====================================================

connectDB();


// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);


// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",

    methods: [
      "GET",
      "POST",
    ],

    credentials: true,
  },
});


// =====================================================
// MAKE SOCKET.IO AVAILABLE IN CONTROLLERS
// =====================================================

app.set("io", io);


// =====================================================
// INITIALIZE SOCKET EVENTS
// =====================================================

queueSocket(io);


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/queue", queueRoutes);

app.use("/api/doctors", doctorRoutes);

app.use("/api/hospitals", hospitalRoutes);

app.use("/api/public", publicRoutes);


// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "PulseQ API running",
  });
});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`PulseQ backend running on port ${PORT}`);
});