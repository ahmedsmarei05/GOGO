const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Product = require("../models/Product");

async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create([
      {
        name: "Admin",
        email: "admin@gogo.com",
        password: await bcrypt.hash("Admin123!", 10),
        role: "admin",
        wishlist: [],
        cart: []
      },
      {
        name: "Mona User",
        email: "user@gogo.com",
        password: await bcrypt.hash("User123!", 10),
        role: "user",
        wishlist: [],
        cart: []
      }
    ]);
    console.log("Default users seeded");
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany([
      {
        name: "Rose Satin Dress",
        category: "Dresses",
        price: 69.99,
        image: "/assets/images/products/pic1.jpeg",
        description: "Soft satin evening dress with elegant feminine cut."
      },
      {
        name: "Blush Linen Blouse",
        category: "Tops",
        price: 34.5,
        image: "/assets/images/products/pr2.jpeg",
        description: "Lightweight linen blouse for casual and chic looks."
      },
      {
        name: "Pearl Pleated Skirt",
        category: "Skirts",
        price: 42.0,
        image: "/assets/images/products/pr3.jpeg",
        description: "Flowy pleated skirt designed for comfort and movement."
      },
      {
        name: "Lavender Wrap Top",
        category: "Tops",
        price: 38.0,
        image: "/assets/images/products/pr4.jpeg",
        description: "Elegant wrap top with soft drape and flattering fit."
      },
      {
        name: "Ivory Midi Dress",
        category: "Dresses",
        price: 74.99,
        image: "/assets/images/products/pr5.jpeg",
        description: "Classic midi dress for day-to-evening wear."
      },
      {
        name: "Sage Linen Pants",
        category: "Bottoms",
        price: 45.0,
        image: "/assets/images/products/pr6.jpeg",
        description: "Relaxed linen pants with a tailored waist."
      }
    ]);
    console.log("Default products seeded");
  }
}

module.exports = seedDatabase;
