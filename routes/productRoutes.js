const express = require("express");
const productController = require("../controllers/productController");
const { productRules } = require("../validators/authValidators");
const { handleValidation } = require("../middleware/validate");
const { requireAdmin } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { handleUpload } = upload;

const router = express.Router();

router.get("/", productController.getAll);
router.get("/:id", productController.getOne);
router.post("/", requireAdmin, handleUpload, productRules, handleValidation, productController.create);
router.put("/:id", requireAdmin, handleUpload, productRules, handleValidation, productController.update);
router.delete("/:id", requireAdmin, productController.remove);

module.exports = router;
