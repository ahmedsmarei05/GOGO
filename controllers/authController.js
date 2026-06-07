const bcrypt = require("bcryptjs");
const User = require("../models/User");

function sessionUser(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, fieldErrors: { email: "Email already registered." } });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role: "user" });
    res.json({ success: true, message: "Account created. You can login now." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, fieldErrors: { email: "Invalid email or password." } });
    }
    req.session.user = sessionUser(user);
    const redirect = user.role === "admin" ? "/admin" : "/";
    res.json({ success: true, redirect });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, redirect: "/login" });
  });
};

exports.me = async (req, res) => {
  if (!req.session.user) return res.json({ success: true, user: null });
  const user = await User.findById(req.session.user.id).select("-password");
  if (!user) return res.json({ success: true, user: null });
  res.json({ success: true, user: sessionUser(user) });
};
