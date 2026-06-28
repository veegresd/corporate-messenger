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

        const newMessage = result.rows[0];

        const receiverSocketId =
            req.onlineUsers.get(Number(receiver_id));

        if (receiverSocketId) {
            req.io.to(receiverSocketId).emit(
                "new_message",
                newMessage
            );
        }

        res.status(201).json(newMessage);

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
    `SELECT
        id,
        sender_id,
        receiver_id,
        CASE
            WHEN is_deleted = TRUE THEN 'Сообщение удалено'
            ELSE text
        END AS text,
        created_at,
        is_deleted
     FROM messages
     WHERE
     (sender_id = $1 AND receiver_id = $2)
     OR
     (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at`,
    [currentUserId, otherUserId]
);

await pool.query(
    `UPDATE messages
     SET is_read = TRUE
     WHERE sender_id = $1
     AND receiver_id = $2
     AND is_read = FALSE`,
    [otherUserId, currentUserId]
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
        m.created_at AS last_message_time,
        (
            SELECT COUNT(*)
            FROM messages unread
            WHERE unread.sender_id = u.id
            AND unread.receiver_id = $1
            AND unread.is_read = FALSE
            AND unread.is_deleted = FALSE
        ) AS unread_count
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

async function deleteMessage(req, res) {
    try {
        const messageId = req.params.id;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        const messageResult = await pool.query(
            "SELECT * FROM messages WHERE id = $1",
            [messageId]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({
                error: "Message not found"
            });
        }

        const message = messageResult.rows[0];

        if (message.sender_id !== currentUserId && currentUserRole !== "admin") {
            return res.status(403).json({
                error: "You cannot delete this message"
            });
        }

        const result = await pool.query(
            `UPDATE messages
             SET is_deleted = TRUE
             WHERE id = $1
             RETURNING *`,
            [messageId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Delete message error:", error);

        res.status(500).json({
            error: "Delete message error"
        });
    }
}

async function editMessage(req, res) {
    try {
        const messageId = req.params.id;
        const currentUserId = req.user.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                error: "Text is required"
            });
        }

        const messageResult = await pool.query(
            "SELECT * FROM messages WHERE id = $1",
            [messageId]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({
                error: "Message not found"
            });
        }

        const message = messageResult.rows[0];

        if (message.sender_id !== currentUserId) {
            return res.status(403).json({
                error: "You cannot edit this message"
            });
        }

        if (message.is_deleted) {
            return res.status(400).json({
                error: "Cannot edit deleted message"
            });
        }

        const result = await pool.query(
            `UPDATE messages
             SET text = $1, edited_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [text, messageId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Edit message error:", error);

        res.status(500).json({
            error: "Edit message error"
        });
    }
}

module.exports = {
    createMessage,
    getMessages,
    getDialogs,
    deleteMessage,
    editMessage
};