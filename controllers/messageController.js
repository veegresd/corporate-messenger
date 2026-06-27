const pool = require("../config/db");

async function createMessage(req, res) {
    try {
        const { receiver_id, text } = req.body;

        if (!receiver_id || !text) {
            return res.status(400).json({
                error: "receiver_id and text are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, text)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [req.user.id, receiver_id, text]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Create message error:", error);

        res.status(500).json({
            error: "Create message error"
        });
    }
}

async function getMessages(req, res) {
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
        console.error("Get messages error:", error);

        res.status(500).json({
            error: "Get messages error"
        });
    }
}

async function getDialogs(req, res) {
    try {
        const currentUserId = req.user.id;

        const result = await pool.query(
            `SELECT DISTINCT ON (u.id)
                u.id,
                u.login,
                u.role,
                m.text AS last_message,
                m.created_at AS last_message_time
             FROM messages m
             JOIN users u
                ON u.id = CASE
                    WHEN m.sender_id = $1 THEN m.receiver_id
                    ELSE m.sender_id
                END
             WHERE m.sender_id = $1 OR m.receiver_id = $1
             ORDER BY u.id, m.created_at DESC`,
            [currentUserId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Get dialogs error:", error);

        res.status(500).json({
            error: "Get dialogs error"
        });
    }
}

module.exports = {
    createMessage,
    getMessages,
    getDialogs
};