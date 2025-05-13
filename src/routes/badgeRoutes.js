const express = require("express");
const router = express.Router();

router.get("/:id", (req, res) => {
  const userId = req.params.id;

  const dummyBadges = {
    "456ef990-f39c-4e03-b6c4-85ca171ed559": [
      "Erste Aufgabe erledigt",
      "Level 1 erreicht",
      "5 Prompts geschafft"
    ],
  };

  const badges = dummyBadges[userId] || [];
  res.json({ badges });
});

module.exports = router;
