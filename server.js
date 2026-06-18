const express = require("express");
const pool = require("./config/db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "Server is running"
    });
});

app.get("/users", async (req, res) => {
    try {
        const result = await pool.query("SELECT id, login, role, created_at FROM users");
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Database error"
        });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});