const express = require("express");
const router = express.Router();
const badgeService = require("../services/badgeService");

router.get("/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const badges = await badgeService.getBadgesForUser(userId);
    res.json({ badges });
  } catch (err) {
    console.error("Fehler beim Abrufen der Badges:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

module.exports = router;
