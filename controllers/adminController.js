const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getUsers = async (_req, res) => {
  try {
    const users = await User.find().select("-password -cart").sort({ createdAt: -1 });
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        wishlistCount: u.wishlist.length
      }))
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const emailTaken = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailTaken) {
      return res.status(400).json({ success: false, fieldErrors: { email: "Email already in use." } });
    }

    if (role === "user" && user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, fieldErrors: { role: "Cannot demote the last admin." } });
      }
    }

    user.name = name;
    user.email = email;
    if (role) user.role = role;
    await user.save();

    res.json({
      success: true,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const currentId = req.session.user.id;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    if (user._id.toString() === currentId) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "Cannot delete the last admin." });
      }
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (_req, res) => {
  try {
    const [totalUsers, totalOrders, totalProducts] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Order.countDocuments(),
      Product.countDocuments()
    ]);
    res.json({ totalUsers, totalOrders, totalProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrders = async (_req, res) => {
  try {
    const orders = await Order.find().populate("items.product").sort({ createdAt: -1 });
    res.json(
      orders.map((o) => ({
        id: o._id.toString(),
        userName: o.userName,
        userEmail: o.userEmail,
        phone: o.phone,
        address: o.address,
        notes: o.notes,
        items: o.items.map((i) => ({
          productId: i.product?._id?.toString(),
          productName: i.product?.name,
          quantity: i.quantity,
          size: i.size,
          price: i.priceAtOrder
        })),
        paymentMethod: o.paymentMethod,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt
      }))
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, address, phone } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    if (status !== undefined) order.status = status.trim();
    if (address !== undefined) order.address = address.trim();
    if (phone !== undefined) order.phone = phone.trim();
    await order.save();

    res.json({
      success: true,
      order: {
        id: order._id.toString(),
        userName: order.userName,
        status: order.status,
        address: order.address,
        phone: order.phone,
        total: order.total,
        createdAt: order.createdAt
      }
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const fieldErrors = {};
      Object.values(err.errors).forEach((e) => {
        fieldErrors[e.path] = e.message;
      });
      return res.status(400).json({ success: false, fieldErrors, message: "Validation failed." });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};
