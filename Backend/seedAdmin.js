import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/empAttrition";

async function seedPlatformAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected for seeding");

    const adminEmail = "admin@platform.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("ℹ️ Platform Admin already exists:", adminEmail);
    } else {
      const hashedPassword = await bcrypt.hash("AdminPass123!", 10);
      const admin = await User.create({
        email: adminEmail,
        password: hashedPassword,
        fullName: "System Platform Admin",
        role: "platformAdmin",
      });
      console.log("🚀 Platform Admin created successfully!");
      console.log("   Email:", admin.email);
      console.log("   Password: AdminPass123!");
    }
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database Connection Closed");
  }
}

seedPlatformAdmin();
