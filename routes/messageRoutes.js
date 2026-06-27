const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
    createMessage,
    getMessages
} = require("../controllers/messageController");

router.post("/messages", authMiddleware, createMessage);
router.get("/messages/:userId", authMiddleware, getMessages);

module.exports = router;