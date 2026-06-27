require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const app = express();
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

app.use(express.json());
app.use(authRoutes);
app.use(userRoutes);
app.use(messageRoutes);

// Проверка работы сервера
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



app.listen(3000, () => {
    console.log("Server started on port 3000");
});