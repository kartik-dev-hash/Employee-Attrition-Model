import cron from "node-cron";
import User from "../models/User.js";
import EmployeeFeedback from "../models/feedback.js";
import EmailNotificationLog from "../models/EmailNotificationLog.js";
import { getCurrentPeriodInfo, sendFeedbackEmail } from "./emailService.js";

/**
 * Executes a monthly invitation dispatch for all active employees across authorized companies.
 * Ensures employees who already submitted or were already invited in the period are skipped.
 */
export async function runMonthlyFeedbackInvitations(forcedCompanyCode = null) {
  const { periodKey, periodLabel } = getCurrentPeriodInfo();
  console.log(`[Monthly Reminder Job] Starting monthly feedback invitation run for period: ${periodKey} (${periodLabel})`);

  const userQuery = { role: "employee" };
  if (forcedCompanyCode) {
    userQuery.companyCode = forcedCompanyCode.toUpperCase();
  }

  const employees = await User.find(userQuery).select("_id fullName email companyCode").lean();
  console.log(`[Monthly Reminder Job] Found ${employees.length} eligible employee(s).`);

  const results = {
    periodKey,
    periodLabel,
    totalEmployees: employees.length,
    sent: 0,
    skippedAlreadySubmitted: 0,
    skippedAlreadyNotified: 0,
    failed: 0,
  };

  for (const emp of employees) {
    try {
      // 1. Check if employee already submitted feedback for this monthly period
      const existingSubmission = await EmployeeFeedback.findOne({
        employeeId: emp._id,
        feedbackPeriod: periodKey,
      }).lean();

      if (existingSubmission) {
        results.skippedAlreadySubmitted++;
        continue;
      }

      // 2. Check if employee was already sent an invitation for this period
      const existingLog = await EmailNotificationLog.findOne({
        employeeId: emp._id,
        feedbackPeriod: periodKey,
        type: "MONTHLY_INVITE",
        status: "SENT",
      }).lean();

      if (existingLog) {
        results.skippedAlreadyNotified++;
        continue;
      }

      // 3. Send the email safely
      const sendResult = await sendFeedbackEmail({
        toEmail: emp.email,
        employeeName: emp.fullName,
        periodLabel,
        isReminder: false,
      });

      if (sendResult.success) {
        await EmailNotificationLog.findOneAndUpdate(
          {
            employeeId: emp._id,
            feedbackPeriod: periodKey,
            type: "MONTHLY_INVITE",
          },
          {
            employeeId: emp._id,
            employeeEmail: emp.email,
            employeeName: emp.fullName,
            companyCode: emp.companyCode,
            feedbackPeriod: periodKey,
            type: "MONTHLY_INVITE",
            status: "SENT",
            sentAt: new Date(),
            messageId: sendResult.messageId,
          },
          { upsert: true }
        );
        results.sent++;
      } else {
        await EmailNotificationLog.findOneAndUpdate(
          {
            employeeId: emp._id,
            feedbackPeriod: periodKey,
            type: "MONTHLY_INVITE",
          },
          {
            employeeId: emp._id,
            employeeEmail: emp.email,
            employeeName: emp.fullName,
            companyCode: emp.companyCode,
            feedbackPeriod: periodKey,
            type: "MONTHLY_INVITE",
            status: "FAILED",
            sentAt: new Date(),
            errorMessage: sendResult.error,
          },
          { upsert: true }
        );
        results.failed++;
      }
    } catch (empErr) {
      console.error(`[Monthly Reminder Job] Error processing invite for employee ${emp.email}:`, empErr.message);
      results.failed++;
    }
  }

  console.log(`[Monthly Reminder Job] Invitation run complete:`, results);
  return results;
}

/**
 * Executes a follow-up reminder dispatch (7 days later) for employees who haven't submitted yet.
 * Only sends one reminder per monthly period.
 */
export async function runMonthlyFeedbackFollowUpReminders(forcedCompanyCode = null) {
  const { periodKey, periodLabel } = getCurrentPeriodInfo();
  console.log(`[Monthly Reminder Job] Starting 7-day follow-up reminder run for period: ${periodKey} (${periodLabel})`);

  const userQuery = { role: "employee" };
  if (forcedCompanyCode) {
    userQuery.companyCode = forcedCompanyCode.toUpperCase();
  }

  const employees = await User.find(userQuery).select("_id fullName email companyCode").lean();

  const results = {
    periodKey,
    periodLabel,
    totalEmployees: employees.length,
    sent: 0,
    skippedAlreadySubmitted: 0,
    skippedAlreadyReminded: 0,
    failed: 0,
  };

  for (const emp of employees) {
    try {
      // 1. Check if employee already submitted feedback for this monthly period
      const existingSubmission = await EmployeeFeedback.findOne({
        employeeId: emp._id,
        feedbackPeriod: periodKey,
      }).lean();

      if (existingSubmission) {
        results.skippedAlreadySubmitted++;
        continue;
      }

      // 2. Check if a reminder was already sent for this period
      const existingReminderLog = await EmailNotificationLog.findOne({
        employeeId: emp._id,
        feedbackPeriod: periodKey,
        type: "MONTHLY_REMINDER",
        status: "SENT",
      }).lean();

      if (existingReminderLog) {
        results.skippedAlreadyReminded++;
        continue;
      }

      // 3. Send follow-up reminder
      const sendResult = await sendFeedbackEmail({
        toEmail: emp.email,
        employeeName: emp.fullName,
        periodLabel,
        isReminder: true,
      });

      if (sendResult.success) {
        await EmailNotificationLog.findOneAndUpdate(
          {
            employeeId: emp._id,
            feedbackPeriod: periodKey,
            type: "MONTHLY_REMINDER",
          },
          {
            employeeId: emp._id,
            employeeEmail: emp.email,
            employeeName: emp.fullName,
            companyCode: emp.companyCode,
            feedbackPeriod: periodKey,
            type: "MONTHLY_REMINDER",
            status: "SENT",
            sentAt: new Date(),
            messageId: sendResult.messageId,
          },
          { upsert: true }
        );
        results.sent++;
      } else {
        await EmailNotificationLog.findOneAndUpdate(
          {
            employeeId: emp._id,
            feedbackPeriod: periodKey,
            type: "MONTHLY_REMINDER",
          },
          {
            employeeId: emp._id,
            employeeEmail: emp.email,
            employeeName: emp.fullName,
            companyCode: emp.companyCode,
            feedbackPeriod: periodKey,
            type: "MONTHLY_REMINDER",
            status: "FAILED",
            sentAt: new Date(),
            errorMessage: sendResult.error,
          },
          { upsert: true }
        );
        results.failed++;
      }
    } catch (empErr) {
      console.error(`[Monthly Reminder Job] Error processing reminder for employee ${emp.email}:`, empErr.message);
      results.failed++;
    }
  }

  console.log(`[Monthly Reminder Job] Reminder run complete:`, results);
  return results;
}

/**
 * Initializes cron jobs for monthly automated execution:
 * 1. 1st day of month at 09:00 AM (Asia/Kolkata) -> Initial monthly invitation
 * 2. 8th day of month at 09:00 AM (Asia/Kolkata) -> 7-day follow-up reminder to pending employees
 */
export function initializeFeedbackScheduler() {
  const timezone = process.env.SCHEDULE_TIMEZONE || "Asia/Kolkata";
  const disableCron = process.env.DISABLE_FEEDBACK_CRON === "true";

  if (disableCron) {
    console.log("[Scheduler] Automated feedback cron jobs are disabled via DISABLE_FEEDBACK_CRON=true");
    return;
  }

  // 1st of every month at 09:00 AM
  cron.schedule(
    "0 9 1 * *",
    async () => {
      console.log("[Scheduler Trigger] Running 1st of the month feedback invitations...");
      await runMonthlyFeedbackInvitations();
    },
    { timezone }
  );

  // 8th of every month at 09:00 AM (approximately 7 days after the 1st)
  cron.schedule(
    "0 9 8 * *",
    async () => {
      console.log("[Scheduler Trigger] Running 7-day follow-up reminder for pending employees...");
      await runMonthlyFeedbackFollowUpReminders();
    },
    { timezone }
  );

  console.log(`⏰ [Scheduler] Feedback reminder schedules registered successfully (Timezone: ${timezone})`);
  console.log(`   - Monthly Invitations: 1st of every month at 09:00 AM`);
  console.log(`   - 7-Day Follow-Up Reminders: 8th of every month at 09:00 AM`);
}
