const express = require("express");
const { suggestMatches } = require("../controllers/match.controller");
const { optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/suggest", optionalAuth, suggestMatches);

module.exports = router;
