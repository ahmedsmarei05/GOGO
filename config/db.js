const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined in .env");

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log("MongoDB connected");
  } catch (err) {
    if (uri.startsWith("mongodb+srv://") && /querySrv|ECONNREFUSED|ETIMEOUT/i.test(err.message)) {
      console.error(
        "\nMongoDB SRV DNS lookup failed. Use a direct connection string in .env instead of mongodb+srv://.\n" +
          "In MongoDB Atlas: Connect → Drivers → choose \"Standard connection string\".\n"
      );
    }
    throw err;
  }
}

module.exports = connectDB;
