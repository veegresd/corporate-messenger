require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const pool = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.json());
app.use(express.static("public"));

app.use(authRoutes);
app.use(userRoutes);
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});

app.use(messageRoutes);

const onlineUsers = new Map();
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
        onlineUsers.set(Number(userId), socket.id);

        console.log(
            `User ${userId} connected with socket ${socket.id}`
        );
    });

    socket.on("disconnect", () => {
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
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