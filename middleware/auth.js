function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.xhr || req.headers.accept?.includes("application/json") || req.path.startsWith("/api/")) {
      return res.status(401).json({ success: false, message: "Please login first." });
    }
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    if (req.xhr || req.headers.accept?.includes("application/json") || req.path.startsWith("/api/")) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    return res.redirect("/login");
  }
  next();
}

function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  if (typeof res.locals.active === "undefined") res.locals.active = "";
  next();
}

module.exports = { requireAuth, requireAdmin, attachUser };
