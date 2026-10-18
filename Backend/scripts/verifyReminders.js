import mongoose from "mongoose";
import User from "../models/User.js";
import EmployeeFeedback from "../models/feedback.js";
import EmailNotificationLog from "../models/EmailNotificationLog.js";
import { getCurrentPeriodInfo, sendFeedbackEmail } from "../services/emailService.js";
import { runMonthlyFeedbackInvitations, runMonthlyFeedbackFollowUpReminders } from "../services/reminderScheduler.js";

async function runTests() {
  console.log("================================================================");
  console.log("🧪 TESTING AUTOMATIC MONTHLY FEEDBACK REMINDERS PIPELINE");
  console.log("================================================================");

  await mongoose.connect("mongodb://127.0.0.1:27017/empAttrition");
  console.log("✅ Connected to MongoDB empAttrition");

  // Test 1: Period generation
  const { periodKey, periodLabel } = getCurrentPeriodInfo();
  console.log(`\n[Test 1] Current Monthly Period: ${periodKey} (${periodLabel})`);
  if (!periodKey || !periodLabel) throw new Error("Period calculation failed");

  // Test 2: Verify existing feedback count and documents
  const totalFeedbackCount = await EmployeeFeedback.countDocuments();
  console.log(`[Test 2] Total historical feedback records in database: ${totalFeedbackCount}`);
  if (totalFeedbackCount !== 10) {
    throw new Error(`Expected 10 historical feedback records, found ${totalFeedbackCount}`);
  }
  console.log("✅ Historical feedback records intact (10 records preserved).");

  // Test 3: Test single recipient email formatting and simulation
  const testSend = await sendFeedbackEmail({
    toEmail: "test.employee@domain.local",
    employeeName: "Test Employee",
    periodLabel,
    isReminder: false,
  });
  console.log("\n[Test 3] Single Email Send Result:", testSend);
  if (!testSend.success) throw new Error("Email sending failed");
  console.log("✅ Email template and safe dispatch working.");

  // Test 4: Run monthly invitation flow
  console.log("\n[Test 4] Running monthly feedback invitation test...");
  const inviteResult = await runMonthlyFeedbackInvitations("DM0Z8F");
  console.log("Invitation results:", inviteResult);
  console.log("✅ Monthly invitation run completed.");

  // Test 5: Verify idempotency / duplicate prevention on restart
  console.log("\n[Test 5] Running invitation again to verify duplicate prevention...");
  const secondInviteResult = await runMonthlyFeedbackInvitations("DM0Z8F");
  console.log("Second invitation results:", secondInviteResult);
  if (secondInviteResult.sent !== 0) {
    throw new Error("Duplicate prevention failed! Sent emails on re-run.");
  }
  console.log("✅ Duplicate prevention verified! Sent 0 duplicate emails on re-run.");

  // Test 6: Run follow-up reminders
  console.log("\n[Test 6] Running follow-up reminder test for pending employees...");
  const reminderResult = await runMonthlyFeedbackFollowUpReminders("DM0Z8F");
  console.log("Reminder results:", reminderResult);
  console.log("✅ Follow-up reminder run completed.");

  // Test 7: Verify follow-up reminder duplicate prevention
  console.log("\n[Test 7] Running follow-up reminder again to verify duplicate prevention...");
  const secondReminderResult = await runMonthlyFeedbackFollowUpReminders("DM0Z8F");
  console.log("Second reminder results:", secondReminderResult);
  if (secondReminderResult.sent !== 0) {
    throw new Error("Duplicate reminder prevention failed! Sent emails on re-run.");
  }
  console.log("✅ Duplicate reminder prevention verified! Sent 0 duplicate reminders.");

  // Test 8: Clean up test notification logs created during this test
  const cleanLogs = await EmailNotificationLog.deleteMany({ companyCode: "DM0Z8F" });
  console.log(`\n[Cleanup] Cleared ${cleanLogs.deletedCount} test notification log(s) for clean deployment.`);

  await mongoose.disconnect();
  console.log("\n================================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
