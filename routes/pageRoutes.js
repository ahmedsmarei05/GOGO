const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", (_req, res) => res.render("home"));
router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect(req.session.user.role === "admin" ? "/admin" : "/");
  res.render("login");
});
router.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("register");
});
router.get("/collection", (_req, res) => res.render("collection"));
router.get("/product", (_req, res) => res.render("product"));
router.get("/cart", requireAuth, (_req, res) => res.render("cart"));
router.get("/checkout", requireAuth, (_req, res) => res.render("checkout"));
router.get("/wishlist", requireAuth, (_req, res) => res.render("wishlist"));
router.get("/admin", requireAdmin, (_req, res) => res.render("admin"));

module.exports = router;
