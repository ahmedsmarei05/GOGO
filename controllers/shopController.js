const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

function formatProduct(p) {
  if (!p) return null;
  const doc = p._id ? p : p;
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    price: doc.price,
    image: doc.image,
    description: doc.description
  };
}

exports.getCart = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate("cart.product");
    res.json(
      user.cart.map((item) => ({
        productId: item.product._id.toString(),
        quantity: item.quantity,
        size: item.size,
        product: formatProduct(item.product)
      }))
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, size = "M" } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const user = await User.findById(req.session.user.id);
    const existing = user.cart.find((i) => i.product.toString() === productId && i.size === size);
    if (existing) existing.quantity += 1;
    else user.cart.push({ product: productId, quantity: 1, size });
    await user.save();
    res.json({ success: true, message: `${product.name} (size ${size}) added to your cart.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, size = "M", action } = req.body;
    const user = await User.findById(req.session.user.id);
    const idx = user.cart.findIndex((i) => i.product.toString() === productId && i.size === size);
    if (idx === -1) return res.status(404).json({ success: false, message: "Item not in cart." });

    if (action === "increase") user.cart[idx].quantity += 1;
    else if (action === "decrease") user.cart[idx].quantity -= 1;

    if (action === "remove" || user.cart[idx].quantity <= 0) user.cart.splice(idx, 1);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.session.user.id, { cart: [] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate("wishlist");
    res.json(user.wishlist.map(formatProduct));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const user = await User.findById(req.session.user.id);
    const idx = user.wishlist.findIndex((id) => id.toString() === productId);
    let added;
    if (idx >= 0) {
      user.wishlist.splice(idx, 1);
      added = false;
    } else {
      user.wishlist.push(productId);
      added = true;
    }
    await user.save();
    res.json({ success: true, added, count: user.wishlist.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.session.user.id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id).populate("cart.product");
    if (!user.cart.length) {
      return res.status(400).json({ success: false, fieldErrors: { cart: "Cart is empty." } });
    }

    const { fullName, phone, address, notes } = req.body;
    let total = 0;
    const items = user.cart.map((item) => {
      const lineTotal = item.product.price * item.quantity;
      total += lineTotal;
      return {
        product: item.product._id,
        quantity: item.quantity,
        size: item.size,
        priceAtOrder: item.product.price
      };
    });

    const order = await Order.create({
      user: user._id,
      userName: fullName,
      userEmail: user.email,
      phone,
      address,
      notes: notes || null,
      items,
      total,
      paymentMethod: "COD",
      status: "Pending (COD)"
    });

    user.cart = [];
    await user.save();

    res.json({ success: true, message: "Order placed. You will pay cash when your package arrives.", orderId: order._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
