const Product = require("../models/Product");
const { uploadProductImage, deleteProductImage } = require("../services/cloudinaryUpload");

function formatProduct(p) {
  return {
    id: p._id.toString(),
    name: p.name,
    category: p.category,
    price: p.price,
    image: p.image,
    description: p.description
  };
}

exports.getAll = async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, fieldErrors: { pImage: "Product image is required." } });
    }

    const { name, category, price, description } = req.body;
    const uploaded = await uploadProductImage(req.file);

    const product = await Product.create({
      name,
      category,
      price: Number(price),
      image: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      description
    });
    res.status(201).json({ success: true, product: formatProduct(product) });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || "Could not upload product image.",
      fieldErrors: err.fieldErrors
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    if (product.imagePublicId) {
      await deleteProductImage(product.imagePublicId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const { name, category, price, description } = req.body;
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (price !== undefined) product.price = Number(price);
    if (description !== undefined) product.description = description.trim();

    if (req.file) {
      const uploaded = await uploadProductImage(req.file);
      if (product.imagePublicId) {
        await deleteProductImage(product.imagePublicId);
      }
      product.image = uploaded.secure_url;
      product.imagePublicId = uploaded.public_id;
    }

    await product.save();
    res.json({ success: true, product: formatProduct(product) });
  } catch (err) {
    if (err.name === "ValidationError") {
      const fieldErrors = {};
      Object.values(err.errors).forEach((e) => {
        fieldErrors[e.path] = e.message;
      });
      return res.status(400).json({ success: false, fieldErrors, message: "Validation failed." });
    }
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message || "Could not update product." });
  }
};
