const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    createMessage,
    getMessages,
    getDialogs
} = require("../controllers/messageController");

router.post("/messages", authMiddleware, createMessage);
router.get("/dialogs", authMiddleware, getDialogs);

module.exports = router;