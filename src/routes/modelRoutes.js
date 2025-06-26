const express = require("express");
const router = express.Router();
const models = require("../config/models");

// Return available AI models
router.get("/", (req, res) => {
  res.json(models);
});

module.exports = router;
