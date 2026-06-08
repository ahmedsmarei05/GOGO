function notFound(req, res) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "Resource not found." });
  }
  res.status(404).render("error", {
    title: "Page not found",
    message: "The page you requested does not exist.",
    statusCode: 404,
    active: ""
  });
}

function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Something went wrong.";

  if (req.path.startsWith("/api/") || req.xhr) {
    return res.status(status).json({ success: false, message });
  }

  res.status(status).render("error", {
    title: "Error",
    message,
    statusCode: status,
    active: ""
  });
}

module.exports = { notFound, errorHandler };
