const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

function assertCloudinaryReady() {
  if (!isCloudinaryConfigured()) {
    const err = new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
    );
    err.status = 500;
    throw err;
  }
}

function uploadProductImage(file) {
  assertCloudinaryReady();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "gogo/products",
        resource_type: "image",
        transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

async function deleteProductImage(publicId) {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Ignore cleanup failures so product CRUD still succeeds.
  }
}

module.exports = { uploadProductImage, deleteProductImage, isCloudinaryConfigured };
