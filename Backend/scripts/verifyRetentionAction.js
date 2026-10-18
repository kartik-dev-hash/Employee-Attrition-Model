import mongoose from "mongoose";
import User from "../models/User.js";
import RetentionAction from "../models/RetentionAction.js";
import { sendMeetingInvitationEmail } from "../services/emailService.js";

async function runTests() {
  console.log("================================================================");
  console.log("🧪 TESTING RETENTION ACTION CENTER BACKEND & LOGIC");
  console.log("================================================================");

  await mongoose.connect("mongodb://127.0.0.1:27017/empAttrition");
  console.log("✅ Connected to MongoDB empAttrition");

  // Test 1: Find an existing employee
  const employee = await User.findOne({ role: "employee" });
  if (!employee) throw new Error("No employee found in database to test");
  console.log(`\n[Test 1] Testing with employee: ${employee.fullName} (${employee.email})`);

  // Test 2: Create / Initialize RetentionAction record
  const actionDoc = await RetentionAction.findOneAndUpdate(
    { employeeId: employee._id, companyCode: employee.companyCode },
    {
      $set: {
        status: "In Progress",
        assignedHR: "Test HR Partner",
        meetingDate: "2026-10-25",
        meetingTime: "11:00",
        meetingLocation: "Discussion Room 2",
        contactMethod: "Email",
        agreedActionPlan: "Agreed to review mentoring opportunities and workload balance.",
        notes: "Confidential check-in completed positively.",
        followUpDate: "2026-11-15",
      },
      $push: {
        contactHistory: {
          contactMethod: "Email",
          contactedAt: new Date(),
          contactedBy: "Test HR Partner",
          recipientEmail: employee.email,
          meetingDetails: "2026-10-25 11:00 (Discussion Room 2)",
          status: "SENT",
          note: "Test invitation dispatch",
        },
      },
    },
    { new: true, upsert: true }
  );

  console.log(`[Test 2] Created/Updated RetentionAction document for employee ID: ${actionDoc.employeeId}`);
  if (actionDoc.status !== "In Progress") throw new Error("Status was not updated properly");
  console.log("✅ RetentionAction document saved with contact history.");

  // Test 3: Test meeting invitation email generation and simulation
  const inviteRes = await sendMeetingInvitationEmail({
    toEmail: employee.email,
    employeeName: employee.fullName,
    meetingDate: "2026-10-25",
    meetingTime: "11:00",
    meetingDetails: "Discussion Room 2",
  });

  console.log(`\n[Test 3] sendMeetingInvitationEmail output:`, inviteRes);
  if (!inviteRes.success) throw new Error("sendMeetingInvitationEmail failed");
  console.log("✅ Meeting invitation formatting & safe dispatch verified.");

  // Test 4: Verify phone number update
  const updatedUser = await User.findByIdAndUpdate(
    employee._id,
    { phoneNumber: "+919876543210" },
    { new: true }
  );
  console.log(`\n[Test 4] Updated employee phoneNumber: ${updatedUser.phoneNumber}`);
  if (updatedUser.phoneNumber !== "+919876543210") throw new Error("Phone update failed");
  console.log("✅ Employee contact phone number persistence verified.");

  // Clean up test phone number back to empty/default if desired
  await User.findByIdAndUpdate(employee._id, { phoneNumber: "" });
  await RetentionAction.deleteOne({ _id: actionDoc._id });
  console.log("✅ Cleaned up test database artifacts.");

  await mongoose.disconnect();
  console.log("\n================================================================");
  console.log("🎉 ALL RETENTION ACTION CENTER TESTS PASSED SUCCESSFULLY!");
  console.log("================================================================");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
