import express from "express";
import User from "./models/User.js";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import EmployeeFeedback from "./models/feedback.js";
import EmployeeAnalytics from "./models/EmployeeAnalytics.js";
import company from "./models/company.js";
import dotenv from "dotenv";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { initializeFeedbackScheduler } from "./services/reminderScheduler.js";

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
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      // or from localhost / any 10.x.x.x / 192.168.x.x local network IP
      const isAllowed =
        !origin ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^http:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin);
      callback(isAllowed ? null : new Error("CORS blocked"), isAllowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
        return res
          .status(400)
          .json({ message: "Associated company not found" });
      }
      if (comp.status === "pending") {
        return res
          .status(403)
          .json({
            message:
              "Your company registration is pending Platform Admin approval.",
          });
      }
      if (comp.status === "rejected") {
        return res
          .status(403)
          .json({
            message:
              "Your company registration has been rejected by the Platform Admin.",
          });
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
app.post(
  "/admin/companies",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    const { companyName, industry, adminName, adminEmail, password } = req.body;

    try {
      const existingComp = await company.findOne({
        companyName: companyName.trim(),
      });
      if (existingComp) {
        return res
          .status(400)
          .json({ message: "Company is already registered" });
      }

      const existingUser = await User.findOne({
        email: adminEmail.toLowerCase().trim(),
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "HR Admin email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const finalCompanyCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

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
  },
);

// List Pending Companies (Platform Admin only)
app.get(
  "/admin/pending-companies",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const pending = await company
        .find({ status: "pending" })
        .populate("primaryHR", "-password")
        .lean();
      res.status(200).json({ companies: pending });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// List ALL Companies with any status (Platform Admin only)
app.get(
  "/admin/all-companies",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const all = await company
        .find({})
        .populate("primaryHR", "-password")
        .sort({ createdAt: -1 })
        .lean();

      // Aggregate user counts per company
      const userCounts = await User.aggregate([
        {
          $group: {
            _id: "$companyCode",
            totalEmployees: {
              $sum: { $cond: [{ $eq: ["$role", "employee"] }, 1, 0] },
            },
            totalHRs: {
              $sum: { $cond: [{ $eq: ["$role", "hr"] }, 1, 0] },
            },
          },
        },
      ]);

      const countMap = {};
      userCounts.forEach((c) => {
        if (c._id) {
          countMap[c._id.toUpperCase()] = c;
        }
      });

      const companiesWithCounts = all.map((c) => {
        const stats = c.companyCode ? countMap[c.companyCode.toUpperCase()] : null;
        return {
          ...c,
          employeeCount: stats ? stats.totalEmployees : 0,
          hrCount: stats ? stats.totalHRs : 0,
        };
      });

      res.status(200).json({ companies: companiesWithCounts });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Approve a pending company (Platform Admin only)
app.put(
  "/admin/approve-company/:id",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const comp = await company.findById(req.params.id);
      if (!comp) return res.status(404).json({ message: "Company not found" });
      if (comp.status === "approved")
        return res.status(400).json({ message: "Company already approved" });
      comp.status = "approved";
      await comp.save();
      res.status(200).json({ message: "Company approved successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Reject a pending company (Platform Admin only)
app.put(
  "/admin/reject-company/:id",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const comp = await company.findById(req.params.id);
      if (!comp) return res.status(404).json({ message: "Company not found" });
      if (comp.status === "rejected")
        return res.status(400).json({ message: "Company already rejected" });
      comp.status = "rejected";
      await comp.save();
      res.status(200).json({ message: "Company rejected successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Legacy Company Registration Endpoint (kept for compatibility)
app.post("/form", async function (req, res) {
  const { companyName, industry, adminName, adminEmail, password } = req.body;

  try {
    const find = await company.findOne({ companyName: companyName.trim() });

    if (find) {
      return res
        .status(400)
        .json({ message: "Your Company is Already Registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const finalCompanyCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

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

// Mount HR Analytics and Machine Learning API endpoints
app.use("/api/hr", isLogedIn, requireRole("hr"), analyticsRoutes);
app.use("/hr/analytics", isLogedIn, requireRole("hr"), analyticsRoutes);

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

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const predictions = await EmployeeFeedback.find({
      employeeId: { $in: employeeIds },
      $or: [
        { feedbackPeriod: currentPeriod },
        { feedbackPeriod: { $exists: false } },
      ],
    })
      .select("employeeId feedbackPeriod")
      .lean();

    const submittedSet = new Set(
      predictions.map((p) => p.employeeId.toString()),
    );

    // Fetch EmployeeAnalytics to get ML prediction per employee
    const analyticsRecords = await EmployeeAnalytics.find({
      employeeId: { $in: employeeIds },
      companyCode: hr.companyCode.toUpperCase(),
    })
      .select("employeeId mlPrediction experimentalSurveyRisk")
      .lean();

    const analyticsMap = {};
    analyticsRecords.forEach((a) => {
      analyticsMap[a.employeeId.toString()] = {
        mlPrediction: a.mlPrediction,
        experimentalSurveyRisk: a.experimentalSurveyRisk,
      };
    });

    const employeesWithStatus = employees.map((emp) => ({
      ...emp,
      submitted: submittedSet.has(emp._id.toString()),
      mlPrediction: analyticsMap[emp._id.toString()]?.mlPrediction || {
        isAvailable: false,
      },
      experimentalSurveyRisk: analyticsMap[emp._id.toString()]
        ?.experimentalSurveyRisk || { level: "NO_FEEDBACK" },
    }));

    const submittedCount = submittedSet.size;

    const feedbacks = await EmployeeFeedback.find({
      employeeId: { $in: employeeIds },
    });

    res.status(200).json({
      companyCode: hr.companyCode,
      currentPeriod,
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

// Check Employee Feedback Status for current monthly cycle
app.get("/predict/status", isLogedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const existingPrediction = await EmployeeFeedback.findOne({
      employeeId: req.user.userId,
      $or: [
        { feedbackPeriod: currentPeriod },
        { feedbackPeriod: { $exists: false } },
      ],
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
      currentPeriod,
      submitted: !!existingPrediction,
      message: existingPrediction
        ? "You have already submitted your feedback for this month 😇"
        : "You have not submitted feedback for this month yet",
    });
  } catch (error) {
    console.log("Status error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Submit Employee Feedback (Employee role only, 1 submission per monthly cycle)
app.post(
  "/predict",
  isLogedIn,
  requireRole("employee"),
  async function (req, res) {
    try {
      const { feedbacks } = req.body;
      const user = req.currentUser;

      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const existingPrediction = await EmployeeFeedback.findOne({
        employeeId: user._id,
        feedbackPeriod: currentPeriod,
      });

      if (existingPrediction) {
        return res.status(400).json({
          message: "You have already submitted your feedback for this month",
        });
      }

      await EmployeeFeedback.create({
        employeeId: user._id, // Taken from logged-in employee identity
        feedbackPeriod: currentPeriod,
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
  },
);

// ============================================================================
// PLATFORM ADMIN — ADDITIONAL ROUTES
// ============================================================================

// List ALL Users across platform (Platform Admin only)
app.get(
  "/admin/users",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const users = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 })
        .lean();
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Platform-wide aggregate statistics (Platform Admin only)
app.get(
  "/admin/platform-stats",
  isLogedIn,
  requireRole("platformAdmin"),
  async function (req, res) {
    try {
      const [totalCompanies, approvedCompanies, pendingCompanies, rejectedCompanies, totalUsers, totalHRs, totalEmployees, totalAdmins] =
        await Promise.all([
          company.countDocuments({}),
          company.countDocuments({ status: "approved" }),
          company.countDocuments({ status: "pending" }),
          company.countDocuments({ status: "rejected" }),
          User.countDocuments({}),
          User.countDocuments({ role: "hr" }),
          User.countDocuments({ role: "employee" }),
          User.countDocuments({ role: "platformAdmin" }),
        ]);

      // Recent 6 months company registrations for trend
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const monthlyCompanies = await company.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const monthlyUsers = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo }, role: { $ne: "platformAdmin" } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      res.status(200).json({
        companies: { total: totalCompanies, approved: approvedCompanies, pending: pendingCompanies, rejected: rejectedCompanies },
        users: { total: totalUsers, hr: totalHRs, employee: totalEmployees, admin: totalAdmins },
        trends: { monthlyCompanies, monthlyUsers },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

// Toggle user active/inactive status (Platform Admin only) — by setting a flag if needed
// For now: toggle companyCode blank to effectively disable or restore
// This is kept minimal per RBAC constraints — no password changes allowed

// ============================================================================
// EMPLOYEE – IN-APP MEETING INVITATION ENDPOINTS
// ============================================================================

// GET /api/employee/invitations/my
// Employee retrieves their own pending or active meeting invitation.
app.get("/api/employee/invitations/my", isLogedIn, requireRole("employee"), async (req, res) => {
  try {
    const RetentionAction = (await import("./models/RetentionAction.js")).default;

    const invitation = await RetentionAction.findOne({
      employeeId: req.currentUser._id,
      meetingDate: { $ne: "" },
    })
      .select(
        "status invitationStatus meetingDate meetingTime meetingLocation meetingLink " +
        "assignedHR notes employeeNote autoScheduled autoScheduledAt " +
        "invitationRespondedAt riskSnapshot exceptionReason inExceptionQueue"
      )
      .sort({ updatedAt: -1 })
      .lean();

    if (!invitation) {
      return res.status(200).json({ invitation: null, message: "No meeting invitation found." });
    }

    // Strip confidential risk scores from employee view
    const safeInvitation = {
      ...invitation,
      riskSnapshot: undefined, // never expose ML scores to employees
    };

    res.status(200).json({ invitation: safeInvitation });
  } catch (error) {
    console.error("Error fetching employee invitation:", error);
    res.status(500).json({ message: error.message });
  }
});

// POST & PATCH /api/employee/invitations/respond
// Employee accepts, declines, or requests rescheduling.
const handleInvitationResponse = async (req, res) => {
  try {
    const { response, note, preferredDate, preferredTime } = req.body;

    if (!["Accepted", "Declined", "RescheduleRequested"].includes(response)) {
      return res.status(400).json({
        message: "Invalid response. Must be 'Accepted', 'Declined', or 'RescheduleRequested'.",
      });
    }

    const RetentionAction = (await import("./models/RetentionAction.js")).default;

    const invitation = await RetentionAction.findOne({
      employeeId: req.currentUser._id,
      invitationStatus: { $in: ["Pending", "RescheduleRequested"] },
    });

    if (!invitation) {
      return res.status(404).json({ message: "No pending invitation found to respond to." });
    }

    const updateFields = {
      invitationStatus: response,
      invitationRespondedAt: new Date(),
      employeeNote: note || "",
    };

    if (response === "Accepted") {
      updateFields.status = "In Progress";
    } else if (response === "Declined") {
      updateFields.status = "Cancelled";
      updateFields.meetingDate = "";
      updateFields.meetingTime = "";
      updateFields.meetingLink = "";
    } else if (response === "RescheduleRequested") {
      // Employee preference stored; HR must confirm
      updateFields.notes = `Employee requested reschedule${preferredDate ? ` to ${preferredDate}` : ""}${preferredTime ? ` at ${preferredTime}` : ""}. Note: ${note || "none"}.`;
    }

    const historyEntry = {
      contactMethod: "Other",
      contactedAt: new Date(),
      contactedBy: req.currentUser.fullName || "Employee",
      status: response.toUpperCase(),
      note: note || `Employee responded: ${response}`,
    };

    await RetentionAction.findByIdAndUpdate(invitation._id, {
      $set: updateFields,
      $push: { contactHistory: historyEntry },
    });

    res.status(200).json({
      message: `Response recorded: ${response}`,
      invitationStatus: response,
    });
  } catch (error) {
    console.error("Error recording invitation response:", error);
    res.status(500).json({ message: error.message });
  }
};

app.patch("/api/employee/invitations/respond", isLogedIn, requireRole("employee"), handleInvitationResponse);
app.post("/api/employee/invitations/respond", isLogedIn, requireRole("employee"), handleInvitationResponse);

// ============================================================================
// SERVER LISTEN
// ============================================================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}`);
  initializeFeedbackScheduler();
});

