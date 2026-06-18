require("dotenv").config();

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

app.listen(3000, () => {
    console.log("Server started on port 3000");
});