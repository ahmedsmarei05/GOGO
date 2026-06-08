const express = require("express");
const adminController = require("../controllers/adminController");
const { updateUserRules, orderUpdateRules } = require("../validators/authValidators");
const { handleValidation } = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.use(requireAdmin);

router.get("/stats", adminController.getStats);
router.get("/orders", adminController.getOrders);
router.get("/users", adminController.getUsers);
router.put("/users/:id", updateUserRules, handleValidation, adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.patch("/orders/:id/status", adminController.updateOrderStatus);
router.patch("/orders/:id", orderUpdateRules, handleValidation, adminController.updateOrder);

module.exports = router;
