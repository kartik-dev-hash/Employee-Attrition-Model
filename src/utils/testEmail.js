// src/utils/testEmail.js
import { sendWelcomeEmail } from "./emailService";

// Test the email sending
async function testEmail() {
  const result = await sendWelcomeEmail({
    email: "raghuwanshikartik521@gmail.com", // Put YOUR email here
    fullName: "Test User",
    password: "Test123!",
    companyCode: "HR-TEST123",
    role: "HR",
  });

  if (result) {
    console.log("✅ Email sent successfully! Check your inbox.");
  } else {
    console.log("❌ Email failed. Check your EmailJS configuration.");
  }
}

testEmail();
