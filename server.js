require("dotenv").config();

const authMiddleware = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./config/db");

const app = express();

app.use(express.json());


// Проверка работы сервера
app.get("/", (req, res) => {
    res.json({
        status: "Server is running"
    });
});

// Получить всех пользователей
app.get("/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, login, role, created_at FROM users"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            error: "Database error"
        });
    }
});

app.post("/users", async (req, res) => {
    try {
        const { login, password, role } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                error: "Login and password are required"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (login, password_hash, role)
             VALUES ($1, $2, $3)
             RETURNING id, login, role, created_at`,
            [login, passwordHash, role || "user"]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Create user error"
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                error: "Login and password are required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE login = $1",
            [login]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: "Invalid login or password"
            });
        }

        const user = result.rows[0];

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Invalid login or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                login: user.login,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            message: "Login successful",
            token
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            error: "Login error"
        });
    }
});

app.get("/profile", authMiddleware, (req, res) => {
    res.json({
        user: req.user
    });
});

app.post("/messages", authMiddleware, async (req, res) => {
    try {
        const { receiver_id, text } = req.body;

        if (!receiver_id || !text) {
            return res.status(400).json({
                error: "receiver_id and text are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO messages
            (sender_id, receiver_id, text)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [
                req.user.id,
                receiver_id,
                text
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Create message error"
        });
    }
});

app.get("/messages/:userId", authMiddleware, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.userId;

        const result = await pool.query(
            `SELECT *
             FROM messages
             WHERE
             (sender_id = $1 AND receiver_id = $2)
             OR
             (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at`,
            [currentUserId, otherUserId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Get messages error"
        });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});