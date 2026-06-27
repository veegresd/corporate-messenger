const bcrypt = require("bcrypt");
const pool = require("../config/db");

async function getUsers(req, res) {
    try {
        const result = await pool.query(
            "SELECT id, login, role, created_at FROM users"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            error: "Get users error"
        });
    }
}

async function createUser(req, res) {
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
        console.error("Create user error:", error);

        res.status(500).json({
            error: "Create user error"
        });
    }
}

module.exports = {
    getUsers,
    createUser
};