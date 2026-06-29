const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getUserStatus } = require("../controllers/statusController");

router.get("/status/:userId", authMiddleware, getUserStatus);

module.exports = router;