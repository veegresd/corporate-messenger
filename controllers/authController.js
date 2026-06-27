const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function login(req, res) {
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
}

module.exports = {
    login
};