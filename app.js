require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const connectDB = require("./config/db");
const seedDatabase = require("./config/seed");
const { attachUser } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const shopRoutes = require("./routes/shopRoutes");
const adminRoutes = require("./routes/adminRoutes");
const apiRoutes = require("./routes/apiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "gogo-dev-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
  })
);

app.use(attachUser);

app.use("/", pageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/external", apiRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  await connectDB();
  await seedDatabase();
  const { isCloudinaryConfigured } = require("./services/cloudinaryUpload");
  if (!isCloudinaryConfigured()) {
    console.warn("Cloudinary is not configured. Add Cloudinary keys to .env before uploading product images.");
  }
  app.listen(PORT, () => console.log(`GOGO server running at http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
