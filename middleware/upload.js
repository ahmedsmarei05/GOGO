const multer = require("multer");

function fileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files (jpg, png, webp, gif) are allowed."));
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

function handleUpload(req, res, next) {
  upload.single("pImage")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        fieldErrors: { pImage: err.message },
        message: err.message
      });
    }
    next();
  });
}

module.exports = upload;
module.exports.handleUpload = handleUpload;
