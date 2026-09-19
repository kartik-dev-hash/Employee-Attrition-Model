import express from "express";
import User from "./models/User.js";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prediction from "./models/prediction.js";
import company from "./models/company.js";
import dotenv from "dotenv";

dotenv.config();

mongoose
  .connect("mongodb://127.0.0.1:27017/empAttrition")
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => console.log("❌ MongoDB Error:", err));

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://10.83.53.237:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Server health test endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "Server is running!",
    dbStatus:
      mongoose.connection.readyState === 1 ? "Connected" : "Not connected",
  });
});

// ============================================================================
// AUTHENTICATION & AUTHORIZATION MIDDLEWARE
// ============================================================================

// Simple Authentication Middleware: verifies JWT token from Authorization header
function isLogedIn(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token not provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, email, role, companyCode }
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// Simple Role Authorization Middleware: verifies user role in MongoDB
function requireRole(requiredRole) {
  return async function (req, res, next) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      if (user.role !== requiredRole) {
        return res.status(403).json({
          message: `Access denied. Requires ${requiredRole} role.`,
        });
      }

      req.currentUser = user; // Attach verified database user object
      next();
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  };
}

// ============================================================================
// PUBLIC AUTH ROUTE
// ============================================================================

// LOGIN API (platformAdmin, hr, employee)
app.post("/login", async function (req, res) {
  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // If the user is HR or Employee, verify the company's approval status
    if (user.role === "hr" || user.role === "employee") {
      const comp = await company.findOne({ companyCode: user.companyCode });
      if (!comp) {
        return res.status(400).json({ message: "Associated company not found" });
      }
      if (comp.status === "pending") {
        return res.status(403).json({ message: "Your company registration is pending Platform Admin approval." });
      }
      if (comp.status === "rejected") {
        return res.status(403).json({ message: "Your company registration has been rejected by the Platform Admin." });
      }
    }

    // Sign JWT using JWT_SECRET from environment
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        companyCode: user.companyCode,
      },
      process.env.JWT_SECRET,
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyCode: user.companyCode,
        employeeCode: user.employeeCode,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// PLATFORM ADMIN ROUTES
// ============================================================================

// Create & Approve Company + Primary HR (Platform Admin only)
app.post("/admin/companies", isLogedIn, requireRole("platformAdmin"), async function (req, res) {
  const { companyName, industry, adminName, adminEmail, password } = req.body;

  try {
    const existingComp = await company.findOne({ companyName: companyName.trim() });
    if (existingComp) {
      return res.status(400).json({ message: "Company is already registered" });
    }

    const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: "HR Admin email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalCompanyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Create Primary HR user
    const hrUser = await User.create({
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      fullName: adminName.trim(),
      role: "hr",
      companyCode: finalCompanyCode,
    });

    // 2. Create Company
    const companyInfo = await company.create({
      companyName: companyName.trim(),
      industry: industry.trim(),
      primaryHR: hrUser._id,
      companyCode: finalCompanyCode,
    });

    res.status(201).json({
      message: "Company and Primary HR registered successfully",
      companyInfo,
      hr: {
        id: hrUser._id,
        fullName: hrUser.fullName,
        email: hrUser.email,
        role: hrUser.role,
        companyCode: hrUser.companyCode,
      },
    });
  } catch (error) {
    console.error("Admin company creation error:", error);
    res.status(500).json({ message: error.message });
  }
});

// List Pending Companies (Platform Admin only)
app.get("/admin/pending-companies", isLogedIn, requireRole("platformAdmin"), async function (req, res) {
  try {
    const pending = await company.find({ status: "pending" }).populate("primaryHR", "-password").lean();
    res.status(200).json({ companies: pending });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List ALL Companies with any status (Platform Admin only)
app.get("/admin/all-companies", isLogedIn, requireRole("platformAdmin"), async function (req, res) {
  try {
    const all = await company.find({}).populate("primaryHR", "-password").lean();
    res.status(200).json({ companies: all });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve a pending company (Platform Admin only)
app.put("/admin/approve-company/:id", isLogedIn, requireRole("platformAdmin"), async function (req, res) {
  try {
    const comp = await company.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: "Company not found" });
    if (comp.status === "approved") return res.status(400).json({ message: "Company already approved" });
    comp.status = "approved";
    await comp.save();
    res.status(200).json({ message: "Company approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject a pending company (Platform Admin only)
app.put("/admin/reject-company/:id", isLogedIn, requireRole("platformAdmin"), async function (req, res) {
  try {
    const comp = await company.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: "Company not found" });
    if (comp.status === "rejected") return res.status(400).json({ message: "Company already rejected" });
    comp.status = "rejected";
    await comp.save();
    res.status(200).json({ message: "Company rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Legacy Company Registration Endpoint (kept for compatibility)
app.post("/form", async function (req, res) {
  const { companyName, industry, adminName, adminEmail, password } = req.body;

  try {
    const find = await company.findOne({ companyName: companyName.trim() });

    if (find) {
      return res.status(400).json({ message: "Your Company is Already Registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalCompanyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await User.create({
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      fullName: adminName.trim(),
      role: "hr",
      companyCode: finalCompanyCode,
    });

    const companyInfo = await company.create({
      companyName: companyName.trim(),
      industry: industry.trim(),
      primaryHR: user._id,
      companyCode: finalCompanyCode,
    });

    res.status(201).json({
      message: "Registered",
      companyInfo: companyInfo,
      hr: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        companyCode: user.companyCode,
      },
    });
  } catch (error) {
    console.log("Registering Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// HR ROUTES
// ============================================================================

// Get Employees & Feedbacks for Logged-In HR's Company Only
app.get("/hr/employees", isLogedIn, requireRole("hr"), async (req, res) => {
  try {
    const hr = req.currentUser;

    // Fetch employees belonging strictly to HR's companyCode
    const employees = await User.find({
      companyCode: hr.companyCode,
      role: "employee",
    })
      .select("-password")
      .lean();

    const employeeIds = employees.map((e) => e._id);

    const predictions = await prediction
      .find({ employeeId: { $in: employeeIds } })
      .select("employeeId")
      .lean();

    const submittedSet = new Set(
      predictions.map((p) => p.employeeId.toString()),
    );

    const employeesWithStatus = employees.map((emp) => ({
      ...emp,
      submitted: submittedSet.has(emp._id.toString()),
    }));

    const submittedCount = await prediction.countDocuments({
      employeeId: { $in: employeeIds },
    });

    const feedbacks = await prediction.find({
      employeeId: { $in: employeeIds },
    });

    res.status(200).json({
      companyCode: hr.companyCode,
      employees: employeesWithStatus,
      submittedCount,
      pendingFeedbacks: employees.length - submittedCount,
      feedbacks,
    });
  } catch (error) {
    console.log("Get employees error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create Co-HR Admin for Logged-In HR's Company Only
app.post("/hr/create", isLogedIn, requireRole("hr"), async function (req, res) {
  const { email, password, fullName } = req.body;

  try {
    const hr = req.currentUser;

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role: "hr", // Forced to HR by backend
      companyCode: hr.companyCode, // Taken from logged-in HR
    });

    res.status(201).json({
      message: "HR registered successfully",
      hr: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        companyCode: user.companyCode,
      },
    });
  } catch (error) {
    console.error("HR creation error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Create Employee for Logged-In HR's Company Only
app.post("/Save", isLogedIn, requireRole("hr"), async function (req, res) {
  const { email, password, fullName } = req.body;

  try {
    const hr = req.currentUser;

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeCode =
      "EMP-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: fullName.trim(),
      role: "employee", // Forced to employee by backend
      companyCode: hr.companyCode, // Taken from logged-in HR
      employeeCode: employeeCode, // Generated by backend
    });

    res.status(201).json({
      message: "Employee registered successfully",
      employee: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        companyCode: user.companyCode,
        employeeCode: user.employeeCode,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// EMPLOYEE ROUTES
// ============================================================================

// Check Employee Feedback Status
app.get("/predict/status", isLogedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingPrediction = await prediction.findOne({
      employeeId: req.user.userId,
    });

    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        companyCode: user.companyCode,
        employeeCode: user.employeeCode,
      },
      submitted: !!existingPrediction,
      message: existingPrediction
        ? "You have already submitted your feedback 😇"
        : "You have not submitted feedback yet",
    });
  } catch (error) {
    console.log("Status error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Submit Employee Feedback (Employee role only)
app.post("/predict", isLogedIn, requireRole("employee"), async function (req, res) {
  try {
    const { feedbacks } = req.body;
    const user = req.currentUser;

    const existingPrediction = await prediction.findOne({
      employeeId: user._id,
    });

    if (existingPrediction) {
      return res.status(400).json({
        message: "You have already submitted your feedback",
      });
    }

    await prediction.create({
      employeeId: user._id, // Taken from logged-in employee identity
      jobSatisfaction: feedbacks.jobSatisfaction,
      workEnvironment: feedbacks.workEnvironment,
      workLifeBalance: feedbacks.workLifeBalance,
      growth: feedbacks.growth,
      manager: feedbacks.manager,
      likedMost: feedbacks.likedMost,
      improvement: feedbacks.improvement,
      comments: feedbacks.comments,
    });

    res.json({
      message: "Feedback Submitted Successfully",
    });
  } catch (error) {
    console.log("Prediction error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// SERVER LISTEN
// ============================================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}`);
});
