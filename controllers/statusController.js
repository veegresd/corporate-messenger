async function getUserStatus(req, res) {
    try {
        const userId = Number(req.params.userId);

        const isOnline = req.onlineUsers.has(userId);
        const lastSeen = req.lastSeen.get(userId) || null;

        res.json({
            userId,
            online: isOnline,
            lastSeen
        });
    } catch (error) {
        console.error("Get user status error:", error);

        res.status(500).json({
            error: "Get user status error"
        });
    }
}

module.exports = {
    getUserStatus
};