const express = require("express");
const authController = require("../controllers/authController");
const { registerRules, loginRules } = require("../validators/authValidators");
const { handleValidation } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerRules, handleValidation, authController.register);
router.post("/login", loginRules, handleValidation, authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", authController.me);

module.exports = router;
