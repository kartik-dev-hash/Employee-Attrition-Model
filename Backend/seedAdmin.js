import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/empAttrition";

async function seedPlatformAdmin() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 60000,
      connectTimeoutMS: 60000,
    });
    console.log("✅ MongoDB Connected for seeding");

    const newAdminEmail = "admin123@gmail.com";
    const newAdminPassword = "1234";
    const hashedPassword = await bcrypt.hash(newAdminPassword, 10);

    // Update existing platform admin or create new one
    const result = await User.findOneAndUpdate(
      { role: "platformAdmin" },
      {
        $set: {
          email: newAdminEmail,
          password: hashedPassword,
          fullName: "System Platform Admin",
          role: "platformAdmin",
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    console.log("🚀 Platform Admin updated/created successfully!");
    console.log("   Email:", result.email);
    console.log("   Password:", newAdminPassword);
    console.log("   Role:", result.role);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Database Connection Closed");
  }
}

seedPlatformAdmin();
