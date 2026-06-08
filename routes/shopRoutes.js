const express = require("express");
const shopController = require("../controllers/shopController");
const { checkoutRules } = require("../validators/authValidators");
const { handleValidation } = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/cart", requireAuth, shopController.getCart);
router.post("/cart", requireAuth, shopController.addToCart);
router.patch("/cart", requireAuth, shopController.updateCart);
router.delete("/cart", requireAuth, shopController.clearCart);

router.get("/wishlist", requireAuth, shopController.getWishlist);
router.post("/wishlist/toggle", requireAuth, shopController.toggleWishlist);
router.delete("/wishlist/:productId", requireAuth, shopController.removeFromWishlist);

router.post("/orders", requireAuth, checkoutRules, handleValidation, shopController.placeOrder);

module.exports = router;
