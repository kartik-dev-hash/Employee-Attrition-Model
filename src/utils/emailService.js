// frontend/src/utils/emailService.js
import emailjs from "@emailjs/browser";

// EmailJS credentials
const SERVICE_ID = "service_nh43idk";
const TEMPLATE_ID = "template_840p0bb";
const PUBLIC_KEY = "3q7VCQ0D2kgxzAvfB";

// Dedicated template for reminders/invites if you create one in EmailJS Dashboard.
// Defaults to TEMPLATE_ID until you create a separate template ID in EmailJS.
const REMINDER_TEMPLATE_ID = "template_840p0bb";

export const sendWelcomeEmail = async (userData) => {
  const { to_email, to_name, password } = userData;

  const loginLink =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/signIn`
      : "http://localhost:5173/signIn";

  const templateParams = {
    to_email: to_email,
    email: to_email,
    to_name: to_name,
    name: to_name,
    subject: "Welcome to the Team — Account Credentials",
    message: "Your employee account has been created. Use the credentials below to log in.",
    detail_label: "Temporary Password",
    detail_value: password,
    password: password, // backward-compatible with older templates
    button_label: "Log In to Your Account",
    login_link: loginLink,
    year: new Date().getFullYear(),
  };

  try {
    console.log("📧 Sending email to:", to_email);
    console.log("📧 Template params:", templateParams);

    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY,
    );

    console.log("✅ Email sent successfully!", result);

    return {
      success: true,
      message: "Email sent successfully!",
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    console.error("Error details:", error.text);

    return {
      success: false,
      message: error.text || "Email failed",
    };
  }
};

/**
 * Dispatches monthly feedback cycle invitation or reminder via EmailJS
 */
export const sendFeedbackReminderEmail = async ({
  to_email,
  to_name,
  periodLabel,
  isReminder = false,
  templateId = REMINDER_TEMPLATE_ID,
}) => {
  const loginLink =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/signIn`
      : "http://localhost:5173/signIn";

  const subject = isReminder
    ? `Monthly Feedback Reminder (${periodLabel || "Current Month"})`
    : `Monthly Feedback Invitation (${periodLabel || "Current Month"})`;

  const messageText = isReminder
    ? `This is a reminder to submit your monthly workplace sentiment feedback for ${periodLabel || "this month"}. Your feedback helps HR identify improvements for our team.`
    : `Your monthly workplace sentiment survey for ${periodLabel || "this month"} is now open. Please take a few moments to share your thoughts.`;

  const templateParams = {
    to_email: to_email,
    email: to_email,
    to_name: to_name || "Employee",
    name: to_name || "Employee",
    subject: subject,
    message: messageText,
    detail_label: "Survey Period",
    detail_value: `${periodLabel || "Current Month"} (Survey Active)`,
    password: `${periodLabel || "Current Month"} (Survey Active)`, // backward-compatible
    button_label: "Complete Feedback Survey",
    period: periodLabel || "Current Month",
    login_link: loginLink,
    year: new Date().getFullYear(),
  };

  try {
    console.log("📧 Sending feedback email via EmailJS to:", to_email);
    const result = await emailjs.send(
      SERVICE_ID,
      templateId,
      templateParams,
      PUBLIC_KEY,
    );
    console.log("✅ Feedback email sent successfully via EmailJS!", result);
    return {
      success: true,
      message: "Email sent successfully!",
      result,
    };
  } catch (error) {
    console.error("❌ EmailJS sending failed:", error);
    return {
      success: false,
      message: error.text || error.message || "Email failed",
    };
  }
};

// ─── Meeting Invitation Template ─────────────────────────────────────────────
// Create a NEW template in your EmailJS dashboard and paste its ID here.
// Dedicated template for meeting invitations.
const MEETING_TEMPLATE_ID = "template_84oxkhq";
/**
 * Sends an HR meeting invitation email to the employee.
 * Called from RetentionActionCenter after auto-schedule or manual save.
 *
 * @param {object} data
 * @param {string} data.to_email       - Employee email address
 * @param {string} data.to_name        - Employee full name
 * @param {string} data.hr_name        - HR representative name
 * @param {string} data.meeting_date   - e.g. "2025-11-10"
 * @param {string} data.meeting_time   - e.g. "10:30"
 * @param {string} data.meeting_link   - Jitsi / Google Meet URL
 */
export const sendMeetingInvitationEmail = async ({
  to_email,
  to_name,
  hr_name = "HR Team",
  meeting_date,
  meeting_time,
  meeting_link,
}) => {
  const activeTemplateId = MEETING_TEMPLATE_ID || TEMPLATE_ID;
  if (!activeTemplateId) {
    console.warn("⚠️  No EmailJS template ID configured in emailService.js.");
    return { success: false, message: "Meeting template ID not configured." };
  }

  const portalLink =
    typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/employee/meetings`
      : "http://localhost:5173/employee/meetings";

  const templateParams = {
    to_email,
    email: to_email,
    user_email: to_email,
    recipient_email: to_email,
    to_name: to_name || "Team Member",
    name: to_name || "Team Member",
    user_name: to_name || "Team Member",
    hr_name,
    meeting_date: meeting_date || "To be confirmed",
    meeting_time: meeting_time || "To be confirmed",
    meeting_link: meeting_link || portalLink,
    portal_link: portalLink,
    login_link: portalLink,
    message: `HR Discussion scheduled on ${meeting_date} at ${meeting_time}. Join via: ${meeting_link || portalLink}`,
    password: `Meeting on ${meeting_date} at ${meeting_time} | Room: ${meeting_link || portalLink}`,
    year: new Date().getFullYear(),
  };

  try {
    console.log("📧 Sending meeting invitation to:", to_email);
    const result = await emailjs.send(
      SERVICE_ID,
      MEETING_TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY,
    );
    console.log("✅ Meeting invitation email sent!", result);
    return { success: true, message: "Meeting invitation sent!" };
  } catch (error) {
    console.error("❌ Meeting invitation email failed:", error);
    return { success: false, message: error.text || "Email failed" };
  }
};
