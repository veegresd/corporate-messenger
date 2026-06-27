const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    createMessage,
    getMessages,
    getDialogs,
    deleteMessage,
    editMessage
} = require("../controllers/messageController");

router.post("/messages", authMiddleware, createMessage);
router.get("/dialogs", authMiddleware, getDialogs);
router.delete("/messages/:id", authMiddleware, deleteMessage);
router.get("/messages/:userId", authMiddleware, getMessages);
router.patch("/messages/:id", authMiddleware, editMessage);
module.exports = router;