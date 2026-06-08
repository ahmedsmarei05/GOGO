const { body } = require("express-validator");

const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").trim().isEmail().withMessage("Please enter a valid email.").normalizeEmail(),
  body("password")
    .matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .withMessage("Password must be 8+ chars and include letters and numbers."),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) throw new Error("Passwords do not match.");
    return true;
  })
];

const loginRules = [
  body("email").trim().isEmail().withMessage("Please enter a valid email.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required.")
];

const productRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is too short."),
  body("category").trim().isLength({ min: 2 }).withMessage("Category is too short."),
  body("price").isFloat({ min: 0.01 }).withMessage("Enter a valid price."),
  body("description").trim().isLength({ min: 4 }).withMessage("Description is too short.")
];

const checkoutRules = [
  body("fullName").trim().isLength({ min: 2 }).withMessage("Enter a valid full name."),
  body("phone")
    .trim()
    .custom((value) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) throw new Error("Enter a valid phone number (10–15 digits).");
      return true;
    }),
  body("address").trim().isLength({ min: 8 }).withMessage("Address must be at least 8 characters.")
];

const updateUserRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
  body("email").trim().isEmail().withMessage("Please enter a valid email.").normalizeEmail(),
  body("role").optional().isIn(["user", "admin"]).withMessage("Role must be user or admin.")
];

const orderUpdateRules = [
  body("status")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Status must be at least 2 characters."),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Address must be at least 8 characters."),
  body("phone")
    .optional()
    .trim()
    .custom((value) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) throw new Error("Enter a valid phone number (10–15 digits).");
      return true;
    })
];

module.exports = { registerRules, loginRules, productRules, checkoutRules, updateUserRules, orderUpdateRules };
