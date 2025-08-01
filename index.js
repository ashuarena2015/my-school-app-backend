import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
import { MongoClient } from "mongodb";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const http = require("http");
const { Server } = require("socket.io");

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { routerUsers } = require('./routes/users');
const { routerFee } = require('./routes/fee');
const { routerSchool } = require('./routes/school');

const { SchoolNotifications } = require('./routes/schema/School/school');

// const MONGO_URI_LOCAL = "mongodb://127.0.0.1:27017/signups-testing";
const MONGO_URI_CLOUD = "mongodb+srv://ashuarena:arenaashu@cluster0.teyrnb7.mongodb.net/my-academy?retryWrites=true&w=majority&appName=Cluster0"

mongoose.connect(MONGO_URI_CLOUD, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected:", mongoose.connection.name);
})
.catch(err => {
  console.error("❌ Connection error:", err);
});

  app.use(
    cors({
      origin: function (origin, callback) {
        callback(null, origin || true); // Allow all origins dynamically
      },
      credentials: true,
    }),
  );
  

const server = http.createServer(app);
const port = 3001;

app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

console.log(mongoose.connection.name); 

app.use("/api/school", routerSchool);
app.use("/api/user", routerUsers);
app.use("/api/fee", routerFee);

const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log("Message received:", data);
    io.emit("notification", data.message !== '');
    const response = new SchoolNotifications({
      message: data.message || 'Test message',
      date: new Date(),
    });
    response.save()
      .then(() => {
        console.log("Notification saved successfully");
      })
      .catch((error) => {
        console.error("Error saving notification:", error);
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// app.listen(port, '192.168.1.10', () => {
//   console.log("Listening on 3001");
// });

server.listen(port, '192.168.1.10', () => {
  console.log("✅ Server and WebSocket listening on http://192.168.1.10:3001");
});
