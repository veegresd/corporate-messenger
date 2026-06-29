require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const authMiddleware = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const statusRoutes = require("./routes/statusRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const onlineUsers = new Map();
const lastSeen = new Map();

app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    req.lastSeen = lastSeen;
    next();
});

app.use(authRoutes);
app.use(userRoutes);
app.use(messageRoutes);
app.use(statusRoutes);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
        onlineUsers.set(Number(userId), socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                lastSeen.set(userId, new Date());
                break;
            }
        }

        console.log("User disconnected:", socket.id);
    });
});

app.get("/", (req, res) => {
    res.json({
        status: "Server is running"
    });
});

app.get("/profile", authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

server.listen(3000, () => {
    console.log("Server started on port 3000");
});