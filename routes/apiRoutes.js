const express = require("express");
const apiController = require("../controllers/apiController");

const router = express.Router();

router.get("/exchange-rates", apiController.getExchangeRates);

module.exports = router;
