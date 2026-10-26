import express from "express";
import {
  getCompanyAnalyticsOverview,
  refreshCompanyAnalytics,
  getEmployeeAnalyticsDetails,
} from "../services/analyticsService.js";
import { getModelStatus, trainModel } from "../services/mlService.js";
import EmployeeFeedback from "../models/feedback.js";

const router = express.Router();

// GET /api/hr/analytics/overview
router.get("/overview", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res
        .status(403)
        .json({ message: "HR user is not linked to an authorized company." });
    }

    const data = await getCompanyAnalyticsOverview(hr.companyCode);
    res.status(200).json(data);
  } catch (error) {
    console.error("Error retrieving company analytics overview:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve company analytics.",
        error: error.message,
      });
  }
});

// POST /api/hr/analytics/refresh
router.post("/refresh", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res
        .status(403)
        .json({ message: "HR user is not linked to an authorized company." });
    }

    const snapshot = await refreshCompanyAnalytics(hr.companyCode);
    const mlStatus = await getModelStatus();

    res.status(200).json({
      message: "Analytics refreshed and stored successfully.",
      snapshot,
      mlStatus,
    });
  } catch (error) {
    console.error("Error refreshing company analytics:", error);
    res
      .status(500)
      .json({ message: "Failed to refresh analytics.", error: error.message });
  }
});

// GET /api/hr/analytics/employees/:employeeId
router.get("/employees/:employeeId", async (req, res) => {
  try {
    const hr = req.currentUser;
    const { employeeId } = req.params;

    if (!employeeId || employeeId.length !== 24) {
      return res.status(400).json({ message: "Invalid employee ID format." });
    }

    const result = await getEmployeeAnalyticsDetails(
      employeeId,
      hr.companyCode,
    );
    if (!result) {
      return res
        .status(404)
        .json({
          message: "Employee not found in your authorized organization.",
        });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error retrieving employee analytics:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve employee analytics.",
        error: error.message,
      });
  }
});

// GET /api/hr/ml/status
router.get("/ml/status", async (req, res) => {
  try {
    const status = await getModelStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error("Error retrieving ML status:", error);
    res
      .status(500)
      .json({
        message: "Failed to retrieve ML model status.",
        error: error.message,
      });
  }
});

// POST /api/hr/ml/train
router.post("/ml/train", async (req, res) => {
  try {
    const hr = req.currentUser;
    const { version, datasetPath } = req.body;

    let trainingResult;
    if (datasetPath && typeof datasetPath === "string") {
      trainingResult = await trainModel(datasetPath, version || "1.0.0", true);
    } else {
      // Fetch all stored feedback records available for training check
      const records = await EmployeeFeedback.find({}).lean();
      trainingResult = await trainModel(records, version || "1.0.0", false);
    }
    res.status(200).json(trainingResult);
  } catch (error) {
    console.error("Error running ML training:", error);
    res
      .status(500)
      .json({ message: "ML training execution failed.", error: error.message });
  }
});

// ============================================================================
// HR MONTHLY FEEDBACK REMINDER CONTROLS
// ============================================================================

// GET /api/hr/reminders/status
router.get("/reminders/status", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { getCurrentPeriodInfo, getEmailEngineStatus } = await import("../services/emailService.js");
    const { periodKey, periodLabel } = getCurrentPeriodInfo();
    const EmailNotificationLog = (await import("../models/EmailNotificationLog.js")).default;
    const User = (await import("../models/User.js")).default;

    const employees = await User.find({
      companyCode: hr.companyCode.toUpperCase(),
      role: "employee",
    }).select("_id fullName email");

    const employeeIds = employees.map((e) => e._id);

    const feedbackCount = await EmployeeFeedback.countDocuments({
      employeeId: { $in: employeeIds },
      $or: [
        { feedbackPeriod: periodKey },
        { feedbackPeriod: { $exists: false } },
      ],
    });

    const logs = await EmailNotificationLog.find({
      companyCode: hr.companyCode.toUpperCase(),
      feedbackPeriod: periodKey,
    }).sort({ sentAt: -1 }).lean();

    const invitesSent = logs.filter((l) => l.type === "MONTHLY_INVITE" && l.status === "SENT").length;
    const remindersSent = logs.filter((l) => l.type === "MONTHLY_REMINDER" && l.status === "SENT").length;
    const engineStatus = getEmailEngineStatus ? getEmailEngineStatus() : { isLive: true, engine: "EmailJS API" };

    res.status(200).json({
      periodKey,
      periodLabel,
      totalEmployees: employees.length,
      submittedCount: feedbackCount,
      pendingCount: Math.max(0, employees.length - feedbackCount),
      invitesSent,
      remindersSent,
      isLiveSmtpEnabled: engineStatus.isLive,
      emailEngine: engineStatus.engine,
      recentLogs: logs.slice(0, 10),
    });
  } catch (error) {
    console.error("Error retrieving reminder status:", error);
    res.status(500).json({ message: "Failed to retrieve reminder status.", error: error.message });
  }
});

// POST /api/hr/reminders/send-invitations (Manual trigger or test run)
router.post("/reminders/send-invitations", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { runMonthlyFeedbackInvitations } = await import("../services/reminderScheduler.js");
    const result = await runMonthlyFeedbackInvitations(hr.companyCode);

    res.status(200).json({
      message: "Monthly invitations dispatched successfully.",
      result,
    });
  } catch (error) {
    console.error("Error triggering invitations:", error);
    res.status(500).json({ message: "Failed to trigger invitations.", error: error.message });
  }
});

// POST /api/hr/reminders/send-reminders (Manual trigger or test run for pending)
router.post("/reminders/send-reminders", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { runMonthlyFeedbackFollowUpReminders } = await import("../services/reminderScheduler.js");
    const result = await runMonthlyFeedbackFollowUpReminders(hr.companyCode);

    res.status(200).json({
      message: "Monthly reminders dispatched successfully.",
      result,
    });
  } catch (error) {
    console.error("Error triggering reminders:", error);
    res.status(500).json({ message: "Failed to trigger reminders.", error: error.message });
  }
});

// POST /api/hr/reminders/test-email (Safe single test recipient verification)
router.post("/reminders/test-email", async (req, res) => {
  try {
    const hr = req.currentUser;
    const { testEmail } = req.body;

    const recipient = (testEmail && testEmail.trim()) || hr.email;
    const { getCurrentPeriodInfo, sendFeedbackEmail } = await import("../services/emailService.js");
    const { periodLabel } = getCurrentPeriodInfo();

    const result = await sendFeedbackEmail({
      toEmail: recipient,
      employeeName: hr.fullName || "Valued Team Member",
      periodLabel,
      isReminder: false,
    });

    res.status(200).json({
      message: `Test email processed for ${recipient}`,
      recipient,
      result,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Failed to send test email.", error: error.message });
  }
});

// ============================================================================
// HR RETENTION ACTION CENTER ENDPOINTS
// ============================================================================

// GET /api/hr/retention/actions/:employeeId - Get or initialize retention case
router.get("/retention/actions/:employeeId", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { employeeId } = req.params;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;

    const employee = await User.findOne({
      _id: employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      role: "employee",
    }).select("_id fullName email employeeCode companyCode phoneNumber");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found in your organization." });
    }

    let actionRecord = await RetentionAction.findOne({
      employeeId,
      companyCode: hr.companyCode.toUpperCase(),
    }).lean();

    if (!actionRecord) {
      actionRecord = await RetentionAction.create({
        employeeId,
        companyCode: hr.companyCode.toUpperCase(),
        assignedHR: hr.fullName || "HR Representative",
        assignedHRId: hr._id,
        status: "Pending",
      });
      actionRecord = actionRecord.toObject();
    }

    res.status(200).json({
      employee,
      actionRecord,
    });
  } catch (error) {
    console.error("Error retrieving retention action:", error);
    res.status(500).json({ message: "Failed to retrieve retention action.", error: error.message });
  }
});

// PUT /api/hr/retention/actions/:employeeId - Update retention action plan, status, notes
router.put("/retention/actions/:employeeId", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { employeeId } = req.params;
    const {
      status,
      assignedHR,
      meetingDate,
      meetingTime,
      meetingLocation,
      meetingLink,
      contactMethod,
      suggestedActions,
      agreedActionPlan,
      notes,
      followUpDate,
      phoneNumber,
    } = req.body;

    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;

    // Optionally update employee phone number if provided
    if (phoneNumber !== undefined) {
      await User.updateOne(
        { _id: employeeId, companyCode: hr.companyCode.toUpperCase() },
        { $set: { phoneNumber: phoneNumber.trim() } }
      );
    }

    const updated = await RetentionAction.findOneAndUpdate(
      { employeeId, companyCode: hr.companyCode.toUpperCase() },
      {
        $set: {
          ...(status && { status }),
          ...(assignedHR && { assignedHR }),
          ...(meetingDate !== undefined && { meetingDate }),
          ...(meetingTime !== undefined && { meetingTime }),
          ...(meetingLocation !== undefined && { meetingLocation }),
          ...(meetingLink !== undefined && { meetingLink }),
          ...(contactMethod && { contactMethod }),
          ...(suggestedActions && { suggestedActions }),
          ...(agreedActionPlan !== undefined && { agreedActionPlan }),
          ...(notes !== undefined && { notes }),
          ...(followUpDate !== undefined && { followUpDate }),
        },
      },
      { returnDocument: "after", upsert: true }
    );

    res.status(200).json({
      message: "Retention action updated successfully.",
      actionRecord: updated,
    });
  } catch (error) {
    console.error("Error updating retention action:", error);
    res.status(500).json({ message: "Failed to update retention action.", error: error.message });
  }
});

// POST /api/hr/retention/invite-email - Send meeting invitation email to employee
router.post("/retention/invite-email", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { employeeId, meetingDate, meetingTime, meetingDetails } = req.body;
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required." });
    }

    const User = (await import("../models/User.js")).default;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const { sendMeetingInvitationEmail } = await import("../services/emailService.js");

    const employee = await User.findOne({
      _id: employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      role: "employee",
    });

    if (!employee || !employee.email) {
      return res.status(404).json({ message: "Employee email not found in organization records." });
    }

    const sendResult = await sendMeetingInvitationEmail({
      toEmail: employee.email,
      employeeName: employee.fullName,
      meetingDate,
      meetingTime,
      meetingDetails,
    });

    // Record contact history log
    if (sendResult.success) {
      await RetentionAction.findOneAndUpdate(
        { employeeId, companyCode: hr.companyCode.toUpperCase() },
        {
          $set: {
            meetingDate: meetingDate || "",
            meetingTime: meetingTime || "",
            meetingLocation: meetingDetails || "",
            contactMethod: "Email",
            status: "In Progress",
          },
          $push: {
            contactHistory: {
              contactMethod: "Email",
              contactedAt: new Date(),
              contactedBy: hr.fullName || "HR Team",
              recipientEmail: employee.email,
              meetingDetails: `${meetingDate || "N/A"} ${meetingTime || ""} (${meetingDetails || ""})`,
              status: "SENT",
              note: "Meeting invitation dispatched via email",
            },
          },
        },
        { upsert: true }
      );

      res.status(200).json({
        message: `Meeting invitation sent successfully to ${employee.email}.`,
        result: sendResult,
      });
    } else {
      res.status(500).json({
        message: `Failed to deliver email: ${sendResult.error || "Unknown error"}`,
        result: sendResult,
      });
    }
  } catch (error) {
    console.error("Error sending meeting invitation:", error);
    res.status(500).json({ message: "Failed to send meeting invitation.", error: error.message });
  }
});

// POST /api/hr/retention/log-whatsapp - Record that HR initiated WhatsApp conversation
router.post("/retention/log-whatsapp", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { employeeId, phoneNumber, messageText } = req.body;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;

    await RetentionAction.findOneAndUpdate(
      { employeeId, companyCode: hr.companyCode.toUpperCase() },
      {
        $set: {
          contactMethod: "WhatsApp",
          status: "In Progress",
        },
        $push: {
          contactHistory: {
            contactMethod: "WhatsApp",
            contactedAt: new Date(),
            contactedBy: hr.fullName || "HR Team",
            recipientPhone: phoneNumber || "",
            status: "INITIATED",
            note: messageText ? `Prefilled text opened: "${messageText.substring(0, 60)}..."` : "WhatsApp link opened",
          },
        },
      },
      { upsert: true }
    );

    res.status(200).json({ message: "WhatsApp interaction logged." });
  } catch (error) {
    console.error("Error logging WhatsApp interaction:", error);
    res.status(500).json({ message: "Failed to log interaction.", error: error.message });
  }
});

// ============================================================================
// RETENTION AGENT – AUTO SCHEDULING & EMPLOYEE RESPONSE ENDPOINTS
// ============================================================================

// POST /api/hr/retention/auto-schedule/:employeeId
// HR triggers auto-schedule for a single employee.
router.post("/retention/auto-schedule/:employeeId", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorised company." });
    }

    const { employeeId } = req.params;
    const { evaluateEmployee } = await import("../services/retentionRuleEngine.js");
    const { findAvailableSlot, reserveSlot } = await import("../services/meetingScheduler.js");
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const { sendMeetingInvitationEmail } = await import("../services/emailService.js");
    const User = (await import("../models/User.js")).default;

    // 1. Evaluate eligibility
    const evaluation = await evaluateEmployee(employeeId, hr.companyCode);

    if (!evaluation.eligible) {
      return res.status(200).json({
        scheduled: false,
        reason: evaluation.reason,
        evaluation: evaluation.details,
      });
    }

    // 2. Prevent duplicate active scheduling
    const existing = await RetentionAction.findOne({
      employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      invitationStatus: { $in: ["Pending", "Accepted"] },
      meetingDate: { $ne: "" },
    }).lean();

    if (existing) {
      return res.status(200).json({
        scheduled: false,
        reason: "Active invitation already exists for this employee. Cancel or complete it first.",
        existingMeeting: { date: existing.meetingDate, time: existing.meetingTime, status: existing.invitationStatus },
      });
    }

    // 3. Find an available slot
    const slot = await findAvailableSlot(hr.companyCode);
    if (!slot) {
      // Put into exception queue
      await RetentionAction.findOneAndUpdate(
        { employeeId, companyCode: hr.companyCode.toUpperCase() },
        {
          $set: {
            inExceptionQueue: true,
            exceptionReason: "No available meeting slot found in the next 7 business days.",
            riskSnapshot: {
              mlProbability: evaluation.details.mlProbability,
              mlOutcome: evaluation.details.mlOutcome,
              surveyRiskLevel: evaluation.details.surveyRiskLevel,
              surveyRiskScore: evaluation.details.surveyRiskScore,
              triggeredRules: evaluation.details.triggeredRules,
            },
          },
        },
        { upsert: true }
      );
      return res.status(200).json({
        scheduled: false,
        reason: "No available meeting slot. Employee added to exception queue.",
      });
    }

    // 4. Reserve the slot atomically
    const actionRecord = await reserveSlot({
      employeeId,
      companyCode: hr.companyCode,
      meetingDate: slot.meetingDate,
      meetingTime: slot.meetingTime,
      hrUser: hr,
    });

    if (!actionRecord) {
      return res.status(409).json({
        scheduled: false,
        reason: "Slot was taken by a concurrent booking. Please retry.",
      });
    }

    // 5. Save risk snapshot
    await RetentionAction.findOneAndUpdate(
      { employeeId, companyCode: hr.companyCode.toUpperCase() },
      {
        $set: {
          inExceptionQueue: false,
          exceptionReason: "",
          invitationStatus: "Pending",
          riskSnapshot: {
            mlProbability: evaluation.details.mlProbability,
            mlOutcome: evaluation.details.mlOutcome,
            surveyRiskLevel: evaluation.details.surveyRiskLevel,
            surveyRiskScore: evaluation.details.surveyRiskScore,
            triggeredRules: evaluation.details.triggeredRules,
          },
        },
      }
    );

    // 6. Send email invitation (best-effort – do not fail the booking on email error)
    const employee = await User.findById(employeeId).select("email fullName").lean();
    let emailResult = { success: false, reason: "Employee email not found." };
    if (employee?.email) {
      try {
        emailResult = await sendMeetingInvitationEmail({
          toEmail: employee.email,
          employeeName: employee.fullName,
          meetingDate: slot.meetingDate,
          meetingTime: slot.meetingTime,
          meetingDetails: "HR Office / Video Call – details will be shared separately.",
        });
      } catch (emailErr) {
        emailResult = { success: false, reason: emailErr.message };
      }
    }

    return res.status(200).json({
      scheduled: true,
      slot,
      actionRecord,
      emailResult,
      evaluation: evaluation.details,
    });
  } catch (error) {
    console.error("Error auto-scheduling retention meeting:", error);
    res.status(500).json({ message: "Auto-scheduling failed.", error: error.message });
  }
});

// POST /api/hr/retention/bulk-auto-schedule
// HR triggers auto-scheduling for ALL eligible employees in the company at once.
router.post("/retention/bulk-auto-schedule", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorised company." });
    }

    const { evaluateAllEmployees } = await import("../services/retentionRuleEngine.js");
    const { findAvailableSlot, reserveSlot } = await import("../services/meetingScheduler.js");
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const { sendMeetingInvitationEmail } = await import("../services/emailService.js");
    const User = (await import("../models/User.js")).default;

    const allEvaluations = await evaluateAllEmployees(hr.companyCode);
    const eligible = allEvaluations.filter((e) => e.evaluation.eligible);

    let scheduled = 0;
    let skippedDuplicate = 0;
    let skippedNoSlot = 0;
    let errors = 0;
    const results = [];

    for (const item of eligible) {
      try {
        const { employeeId } = item;
        const { details } = item.evaluation;

        // Skip if already has active invitation
        const existing = await RetentionAction.findOne({
          employeeId,
          companyCode: hr.companyCode.toUpperCase(),
          invitationStatus: { $in: ["Pending", "Accepted"] },
          meetingDate: { $ne: "" },
        }).lean();

        if (existing) {
          skippedDuplicate++;
          results.push({ employeeId, result: "SKIPPED_DUPLICATE" });
          continue;
        }

        const slot = await findAvailableSlot(hr.companyCode);
        if (!slot) {
          // Exception queue
          await RetentionAction.findOneAndUpdate(
            { employeeId, companyCode: hr.companyCode.toUpperCase() },
            {
              $set: {
                inExceptionQueue: true,
                exceptionReason: "No available slot during bulk schedule.",
                riskSnapshot: {
                  mlProbability: details.mlProbability,
                  mlOutcome: details.mlOutcome,
                  surveyRiskLevel: details.surveyRiskLevel,
                  surveyRiskScore: details.surveyRiskScore,
                  triggeredRules: details.triggeredRules,
                },
              },
            },
            { upsert: true }
          );
          skippedNoSlot++;
          results.push({ employeeId, result: "NO_SLOT_EXCEPTION" });
          continue;
        }

        const actionRecord = await reserveSlot({
          employeeId,
          companyCode: hr.companyCode,
          meetingDate: slot.meetingDate,
          meetingTime: slot.meetingTime,
          hrUser: hr,
        });

        if (!actionRecord) {
          skippedNoSlot++;
          results.push({ employeeId, result: "SLOT_CONFLICT" });
          continue;
        }

        await RetentionAction.findOneAndUpdate(
          { employeeId, companyCode: hr.companyCode.toUpperCase() },
          {
            $set: {
              inExceptionQueue: false,
              exceptionReason: "",
              invitationStatus: "Pending",
              riskSnapshot: {
                mlProbability: details.mlProbability,
                mlOutcome: details.mlOutcome,
                surveyRiskLevel: details.surveyRiskLevel,
                surveyRiskScore: details.surveyRiskScore,
                triggeredRules: details.triggeredRules,
              },
            },
          }
        );

        const employee = await User.findById(employeeId).select("email fullName").lean();
        if (employee?.email) {
          try {
            await sendMeetingInvitationEmail({
              toEmail: employee.email,
              employeeName: employee.fullName,
              meetingDate: slot.meetingDate,
              meetingTime: slot.meetingTime,
              meetingDetails: "HR Office / Video Call – details will be shared separately.",
            });
          } catch (_) {
            // Log but don't fail the booking
          }
        }

        scheduled++;
        results.push({ employeeId, result: "SCHEDULED", slot });
      } catch (itemErr) {
        errors++;
        results.push({ employeeId: item.employeeId, result: "ERROR", error: itemErr.message });
      }
    }

    return res.status(200).json({
      message: "Bulk auto-schedule complete.",
      totalEligible: eligible.length,
      scheduled,
      skippedDuplicate,
      skippedNoSlot,
      errors,
      results,
    });
  } catch (error) {
    console.error("Bulk auto-schedule error:", error);
    res.status(500).json({ message: "Bulk auto-schedule failed.", error: error.message });
  }
});

// GET /api/hr/retention/slots
// Returns available meeting slots for the company (used by reschedule picker)
router.get("/retention/slots", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorised company." });
    }
    const { getAvailableSlots } = await import("../services/meetingScheduler.js");
    const limit = Number(req.query.limit) || 20;
    const slots = await getAvailableSlots(hr.companyCode, limit);
    res.status(200).json({ slots });
  } catch (error) {
    console.error("Error getting available slots:", error);
    res.status(500).json({ message: "Failed to retrieve available slots.", error: error.message });
  }
});

// GET /api/hr/retention/all-cases
// Returns all retention action records for the HR's company, with employee info.
router.get("/retention/all-cases", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorised company." });
    }

    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;

    const cases = await RetentionAction.find({
      companyCode: hr.companyCode.toUpperCase(),
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach employee info
    const enriched = await Promise.all(
      cases.map(async (c) => {
        const emp = await User.findById(c.employeeId)
          .select("fullName email employeeCode")
          .lean();
        return { ...c, employee: emp || null };
      })
    );

    res.status(200).json({ cases: enriched });
  } catch (error) {
    console.error("Error fetching all retention cases:", error);
    res.status(500).json({ message: "Failed to retrieve retention cases.", error: error.message });
  }
});

// POST & PATCH /api/hr/retention/cancel/:employeeId
// HR cancels a scheduled meeting.
const handleCancelMeeting = async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorised company." });
    }

    const { employeeId } = req.params;
    const { reason } = req.body;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const mongoose = (await import("mongoose")).default;

    const query = {
      $or: [
        { employeeId: employeeId },
        ...(mongoose.Types.ObjectId.isValid(employeeId)
          ? [{ employeeId: new mongoose.Types.ObjectId(employeeId) }]
          : []),
      ],
      companyCode: hr.companyCode.toUpperCase(),
    };

    const updated = await RetentionAction.findOneAndUpdate(
      query,
      {
        $set: {
          status: "Cancelled",
          invitationStatus: "Declined",
          meetingDate: "",
          meetingTime: "",
          meetingLink: "",
          exceptionReason: reason || "Cancelled by HR.",
        },
        $push: {
          contactHistory: {
            contactMethod: "Other",
            contactedAt: new Date(),
            contactedBy: hr.fullName || "HR Team",
            status: "CANCELLED",
            note: reason || "Meeting cancelled by HR.",
          },
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({ message: "Retention record not found for this employee." });
    }

    res.status(200).json({ message: "Meeting cancelled successfully.", actionRecord: updated });
  } catch (error) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ message: "Failed to cancel meeting.", error: error.message });
  }
};

router.patch("/retention/cancel/:employeeId", handleCancelMeeting);
router.post("/retention/cancel/:employeeId", handleCancelMeeting);

// ============================================================================
// EMPLOYEE – INVITATION RESPONSE ENDPOINTS (no HR role required)
// ============================================================================

// GET /api/employee/invitations/my
// Employee fetches their own pending meeting invitation.
router.get("/employee-invitation/my", async (req, res) => {
  try {
    // This endpoint is mounted under /api/hr but accessible to employees too.
    // We look up by the logged-in user's ID (from JWT via isLogedIn middleware).
    // Note: The /api/hr route uses requireRole("hr") — see app.js.
    // So we expose a separate path in app.js for employees.
    res.status(501).json({ message: "Use /api/employee/invitations/my instead." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================================================
// n8n AI RETENTION AGENT MEETING SCHEDULING & APPROVAL ENDPOINTS
// ============================================================================

const generateMeetLink = (employeeCode) => {
  const room = `RetainPulse-${(employeeCode || "meeting").replace(/[^a-zA-Z0-9]/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  return `https://meet.jit.si/${room}`;
};

// GET /api/hr/high-risk-employees
// Returns all employees meeting attrition risk thresholds in the HR's company
router.get(["/high-risk-employees", "/retention/high-risk-employees"], async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { evaluateAllEmployees } = await import("../services/retentionRuleEngine.js");
    const User = (await import("../models/User.js")).default;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;

    const evaluations = await evaluateAllEmployees(hr.companyCode);
    const eligible = evaluations.filter((item) => item.evaluation.eligible);

    const enriched = await Promise.all(
      eligible.map(async (item) => {
        const emp = await User.findById(item.employeeId)
          .select("fullName email employeeCode phoneNumber createdAt")
          .lean();

        const actionRecord = await RetentionAction.findOne({
          employeeId: item.employeeId,
          companyCode: hr.companyCode.toUpperCase(),
        }).lean();

        return {
          employeeId: item.employeeId,
          employee: emp,
          evaluation: item.evaluation.details,
          triggeredRules: item.evaluation.details.triggeredRules,
          mlProbability: item.evaluation.details.mlProbability,
          surveyRiskLevel: item.evaluation.details.surveyRiskLevel,
          meetingStatus: actionRecord?.status || "NONE",
          proposalStatus: actionRecord?.proposalStatus || "NONE",
          meetingDate: actionRecord?.meetingDate || "",
          meetingTime: actionRecord?.meetingTime || "",
          meetingLink: actionRecord?.meetingLink || "",
          invitationStatus: actionRecord?.invitationStatus || "Pending",
          actionRecord,
        };
      })
    );

    res.status(200).json({
      count: enriched.length,
      highRiskEmployees: enriched,
    });
  } catch (error) {
    console.error("Error fetching high-risk employees:", error);
    res.status(500).json({ message: "Failed to fetch high-risk employees.", error: error.message });
  }
});

// POST /api/hr/retention-meetings/propose (and /retention-meetings/propose/:employeeId)
// Dispatches meeting proposal request to external n8n AI Agent or internal fallback
const handleProposeMeeting = async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const employeeId = req.params.employeeId || req.body.employeeId;
    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required." });
    }

    const User = (await import("../models/User.js")).default;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const { evaluateEmployee } = await import("../services/retentionRuleEngine.js");
    const { findAvailableSlot } = await import("../services/meetingScheduler.js");
    const { callN8nRetentionAgent, generateInternalRetentionProposal } = await import(
      "../services/n8nService.js"
    );

    // 1. Verify employee belongs to HR's authorized company
    const employee = await User.findOne({
      _id: employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      role: "employee",
    }).select("_id fullName email employeeCode companyCode phoneNumber");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found in your authorized organization." });
    }

    // 2. Evaluate risk eligibility
    const evaluation = await evaluateEmployee(employeeId, hr.companyCode);
    if (!evaluation.eligible) {
      return res.status(400).json({
        eligible: false,
        message: "Employee does not meet high-risk threshold for retention scheduling.",
        reason: evaluation.reason,
      });
    }

    // 3. Prevent duplicate proposals if active meeting already confirmed
    const existing = await RetentionAction.findOne({
      employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      status: { $in: ["In Progress", "APPROVED", "Completed"] },
      meetingDate: { $ne: "" },
    }).lean();

    if (existing && existing.status !== "Cancelled") {
      return res.status(409).json({
        message: "An active retention meeting is already scheduled for this employee.",
        existingMeeting: {
          meetingDate: existing.meetingDate,
          meetingTime: existing.meetingTime,
          status: existing.status,
          invitationStatus: existing.invitationStatus,
        },
      });
    }

    // 4. Find internal conflict-free slot as reference/fallback
    const availableSlot = await findAvailableSlot(hr.companyCode);

    // 5. Contact external n8n AI Agent
    const n8nPayload = {
      employeeId: employee._id.toString(),
      employeeName: employee.fullName,
      employeeCode: employee.employeeCode,
      riskLevel: evaluation.details.surveyRiskLevel || "HIGH_RISK",
      mlProbability: evaluation.details.mlProbability,
      riskFactors: evaluation.details.triggeredRules || [],
      purpose: req.body.purpose || "Confidential Retention & Feedback Discussion",
      notes: req.body.notes || "",
      preferredDate: req.body.preferredDate || null,
      preferredTime: req.body.preferredTime || null,
      hrName: hr.fullName || "HR Representative",
      hrEmail: hr.email || "",
    };

    const n8nResult = await callN8nRetentionAgent(n8nPayload);

    let finalProposal;
    let proposalSource;

    if (n8nResult.success && n8nResult.proposal) {
      proposalSource = "n8n_agent";
      finalProposal = {
        ...n8nResult.proposal,
        // If n8n did not propose date/time, pair with internal available slot
        proposedDate: n8nResult.proposal.proposedDate || availableSlot?.meetingDate || req.body.preferredDate || "",
        proposedTime: n8nResult.proposal.proposedTime || availableSlot?.meetingTime || req.body.preferredTime || "",
      };
    } else {
      // Internal deterministic fallback
      proposalSource = "internal_fallback";
      finalProposal = generateInternalRetentionProposal(n8nPayload, availableSlot);
    }

    // 6. Save proposal into RetentionAction with PROPOSED status (requires HR approval)
    const updated = await RetentionAction.findOneAndUpdate(
      { employeeId: employee._id, companyCode: hr.companyCode.toUpperCase() },
      {
        $set: {
          status: "PROPOSED",
          proposalStatus: "PROPOSED",
          proposalSource,
          meetingPurpose: finalProposal.purpose || req.body.purpose || "Confidential Retention & Feedback Discussion",
          meetingAgenda: finalProposal.agenda || "",
          invitationDraft: finalProposal.invitationDraft || {},
          meetingDate: finalProposal.proposedDate || "",
          meetingTime: finalProposal.proposedTime || "",
          proposalNotes: req.body.notes || "",
          proposedAt: new Date(),
          assignedHR: hr.fullName || "HR Representative",
          assignedHRId: hr._id,
          riskSnapshot: {
            mlProbability: evaluation.details.mlProbability,
            mlOutcome: evaluation.details.mlOutcome,
            surveyRiskLevel: evaluation.details.surveyRiskLevel,
            surveyRiskScore: evaluation.details.surveyRiskScore,
            triggeredRules: evaluation.details.triggeredRules,
          },
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    res.status(200).json({
      success: true,
      proposalStatus: "PROPOSED",
      proposalSource,
      isFallback: n8nResult.isFallback || false,
      fallbackReason: n8nResult.reason || null,
      proposal: finalProposal,
      actionRecord: updated,
    });
  } catch (error) {
    console.error("Error proposing retention meeting:", error);
    res.status(500).json({ message: "Failed to generate retention meeting proposal.", error: error.message });
  }
};

router.post("/retention-meetings/propose", handleProposeMeeting);
router.post("/retention-meetings/propose/:employeeId", handleProposeMeeting);
router.post("/retention/propose-meeting/:employeeId", handleProposeMeeting);

// POST /api/hr/retention-meetings/:id/approve
// HR reviews and approves proposed retention meeting, reserves slot and sends invitation
const handleApproveMeeting = async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const targetId = req.params.id;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;
    const mongoose = (await import("mongoose")).default;
    const { reserveSlot } = await import("../services/meetingScheduler.js");
    const { sendMeetingInvitationEmail } = await import("../services/emailService.js");

    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : null },
        { employeeId: mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : null },
      ].filter((q) => Object.values(q)[0] !== null),
      companyCode: hr.companyCode.toUpperCase(),
    };

    const actionRecord = await RetentionAction.findOne(query);
    if (!actionRecord) {
      return res.status(404).json({ message: "Retention meeting record not found." });
    }

    const employee = await User.findById(actionRecord.employeeId)
      .select("fullName email employeeCode phoneNumber companyCode")
      .lean();

    if (!employee) {
      return res.status(404).json({ message: "Associated employee record not found." });
    }

    // Read HR edits or fallback to proposed values
    const finalDate = req.body.meetingDate || actionRecord.meetingDate;
    const finalTime = req.body.meetingTime || actionRecord.meetingTime;
    const finalPurpose = req.body.meetingPurpose || actionRecord.meetingPurpose || "Confidential Retention Discussion";
    const finalAgenda = req.body.meetingAgenda || actionRecord.meetingAgenda || "";
    const finalLocation = req.body.meetingLocation || actionRecord.meetingLocation || "Virtual 1-on-1 (Online)";
    const finalLink = req.body.meetingLink || actionRecord.meetingLink || generateMeetLink(employee.employeeCode);

    if (!finalDate || !finalTime) {
      return res.status(400).json({ message: "Meeting date and time are required to approve the meeting." });
    }

    // Atomically reserve slot to prevent conflict
    const slotReserved = await reserveSlot({
      employeeId: employee._id,
      companyCode: hr.companyCode,
      meetingDate: finalDate,
      meetingTime: finalTime,
      hrUser: hr,
    });

    if (!slotReserved) {
      return res.status(409).json({
        message: `The slot on ${finalDate} at ${finalTime} is already booked. Please choose an alternative slot.`,
      });
    }

    // Dispatch email invitation to employee (best-effort, does not fail DB save)
    let emailResult = { success: false, reason: "No email address found." };
    if (employee.email) {
      try {
        emailResult = await sendMeetingInvitationEmail({
          toEmail: employee.email,
          employeeName: employee.fullName,
          meetingDate: finalDate,
          meetingTime: finalTime,
          meetingDetails: `${finalPurpose} — ${finalAgenda}`,
          meetingLink: finalLink,
        });
      } catch (emailErr) {
        emailResult = { success: false, reason: emailErr.message };
      }
    }

    // Update RetentionAction with APPROVED state
    const updated = await RetentionAction.findOneAndUpdate(
      { _id: actionRecord._id },
      {
        $set: {
          status: "APPROVED",
          proposalStatus: "APPROVED",
          invitationStatus: "Pending",
          meetingDate: finalDate,
          meetingTime: finalTime,
          meetingLocation: finalLocation,
          meetingLink: finalLink,
          meetingPurpose: finalPurpose,
          meetingAgenda: finalAgenda,
          notes: req.body.notes || actionRecord.notes || "",
          approvedAt: new Date(),
          approvedBy: hr.fullName || "HR Representative",
          assignedHR: hr.fullName || "HR Representative",
          assignedHRId: hr._id,
          contactMethod: "Email",
        },
        $push: {
          contactHistory: {
            contactMethod: "Email",
            contactedAt: new Date(),
            contactedBy: hr.fullName || "HR Representative",
            recipientEmail: employee.email || "",
            meetingDetails: `${finalDate} at ${finalTime} | Link: ${finalLink}`,
            status: emailResult.success ? "SENT" : "FAILED",
            note: `Approved retention meeting invitation dispatched via email. Email status: ${emailResult.success ? "Delivered" : emailResult.reason || "Failed"}`,
          },
        },
      },
      { returnDocument: "after" }
    );

    res.status(200).json({
      success: true,
      message: "Retention meeting approved and invitation sent.",
      actionRecord: updated,
      emailResult,
    });
  } catch (error) {
    console.error("Error approving retention meeting:", error);
    res.status(500).json({ message: "Failed to approve retention meeting.", error: error.message });
  }
};

router.post("/retention-meetings/:id/approve", handleApproveMeeting);
router.post("/retention/approve-meeting/:id", handleApproveMeeting);

// POST /api/hr/retention-meetings/:id/reject
// HR rejects a meeting proposal
const handleRejectMeeting = async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const targetId = req.params.id;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const mongoose = (await import("mongoose")).default;

    const query = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : null },
        { employeeId: mongoose.Types.ObjectId.isValid(targetId) ? new mongoose.Types.ObjectId(targetId) : null },
      ].filter((q) => Object.values(q)[0] !== null),
      companyCode: hr.companyCode.toUpperCase(),
    };

    const reason = req.body.reason || "Proposal rejected by HR.";

    const updated = await RetentionAction.findOneAndUpdate(
      query,
      {
        $set: {
          proposalStatus: "REJECTED",
          status: "Cancelled",
          rejectionReason: reason,
          meetingDate: "",
          meetingTime: "",
          meetingLink: "",
        },
        $push: {
          contactHistory: {
            contactMethod: "Other",
            contactedAt: new Date(),
            contactedBy: hr.fullName || "HR Representative",
            status: "REJECTED",
            note: `Proposal rejected by HR: ${reason}`,
          },
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({ message: "Retention meeting record not found." });
    }

    res.status(200).json({
      success: true,
      message: "Retention meeting proposal rejected.",
      actionRecord: updated,
    });
  } catch (error) {
    console.error("Error rejecting retention meeting:", error);
    res.status(500).json({ message: "Failed to reject proposal.", error: error.message });
  }
};

router.post("/retention-meetings/:id/reject", handleRejectMeeting);
router.post("/retention/reject-meeting/:id", handleRejectMeeting);

// GET /api/hr/retention-meetings
// Lists all retention meetings & proposals for the HR's authorized company
router.get("/retention-meetings", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;

    const cases = await RetentionAction.find({
      companyCode: hr.companyCode.toUpperCase(),
    })
      .sort({ updatedAt: -1 })
      .lean();

    const enriched = await Promise.all(
      cases.map(async (c) => {
        const emp = await User.findById(c.employeeId)
          .select("fullName email employeeCode phoneNumber")
          .lean();
        return { ...c, employee: emp || null };
      })
    );

    res.status(200).json({ cases: enriched });
  } catch (error) {
    console.error("Error retrieving retention meetings:", error);
    res.status(500).json({ message: "Failed to retrieve retention meetings.", error: error.message });
  }
});

// GET /api/hr/retention-meetings/:employeeId
// Returns the retention case / proposal for a single employee
router.get("/retention-meetings/:employeeId", async (req, res) => {
  try {
    const hr = req.currentUser;
    if (!hr || !hr.companyCode) {
      return res.status(403).json({ message: "HR user is not linked to an authorized company." });
    }

    const { employeeId } = req.params;
    const RetentionAction = (await import("../models/RetentionAction.js")).default;
    const User = (await import("../models/User.js")).default;

    const employee = await User.findOne({
      _id: employeeId,
      companyCode: hr.companyCode.toUpperCase(),
      role: "employee",
    }).select("fullName email employeeCode phoneNumber companyCode");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found in your organization." });
    }

    const actionRecord = await RetentionAction.findOne({
      employeeId,
      companyCode: hr.companyCode.toUpperCase(),
    }).lean();

    res.status(200).json({
      employee,
      actionRecord: actionRecord || null,
    });
  } catch (error) {
    console.error("Error retrieving retention meeting for employee:", error);
    res.status(500).json({ message: "Failed to retrieve retention meeting.", error: error.message });
  }
});

export default router;

