import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["platformAdmin", "hr", "employee"],
      required: true,
    },

    employeeCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },

    companyCode: {
      type: String,
      uppercase: true,
      trim: true,
    },

    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("User", userSchema);
