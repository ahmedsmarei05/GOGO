const { validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const fieldErrors = {};
    errors.array().forEach((e) => {
      const field = e.path || e.param;
      if (!fieldErrors[field]) fieldErrors[field] = e.msg;
    });
    return res.status(400).json({ success: false, fieldErrors, message: "Validation failed." });
  }
  next();
}

module.exports = { handleValidation };
