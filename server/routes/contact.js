const express = require("express");
const router = express.Router();
const ContactController = require("../controllers/contacts");

router.post("/identify", ContactController.getIdentity);

module.exports = router;