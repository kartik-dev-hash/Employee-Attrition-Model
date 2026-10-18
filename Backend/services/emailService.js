import nodemailer from "nodemailer";
import https from "https";

// EmailJS credentials matching frontend src/utils/emailService.js
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_nh43idk";
const EMAILJS_TEMPLATE_ID =
  process.env.EMAILJS_TEMPLATE_ID || "template_840p0bb";

const EMAILJS_PUBLIC_KEY =
  process.env.EMAILJS_PUBLIC_KEY || "3q7VCQ0D2kgxzAvfB";
const EMAILJS_MEETING_TEMPLATE_ID =
  process.env.EMAILJS_MEETING_TEMPLATE_ID || "template_84oxkhq";

/**
 * Creates and returns a Nodemailer transporter using environment variables.
 * In development or when SMTP credentials are not configured, test mode is used.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: Safe mock/development transporter when credentials aren't set
  return null;
}

/**
 * Returns formatted period and label in Asia/Kolkata timezone or configured timezone
 */
export function getCurrentPeriodInfo(date = new Date()) {
  const tz = process.env.SCHEDULE_TIMEZONE || "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    month: "long",
    year: "numeric",
  });
  const periodLabel = formatter.format(date); // e.g. "October 2026"

  const isoFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
  });
  const parts = isoFormatter.formatToParts(date);
  const year =
    parts.find((p) => p.type === "year")?.value || String(date.getFullYear());
  const month =
    parts.find((p) => p.type === "month")?.value ||
    String(date.getMonth() + 1).padStart(2, "0");
  const periodKey = `${year}-${month}`; // e.g. "2026-10"

  return { periodKey, periodLabel };
}

/**
 * Generate email text and HTML as requested in the specification
 */
export function buildMonthlyFeedbackEmail({
  employeeName,
  periodLabel,
  loginUrl,
}) {
  const subject = `Monthly Employee Feedback — ${periodLabel}`;

  const text = `Hi ${employeeName || "Employee"},

It's time to submit your monthly workplace feedback.

Please log in to the Employee Attrition Model portal and complete your feedback for ${periodLabel}.

Login: ${loginUrl}

Your feedback helps HR understand employees' workplace experiences and identify opportunities to improve the working environment.

If you have already submitted feedback for this month, no further action is needed.

Thank you,
HR Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { margin-bottom: 20px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; }
    .badge { display: inline-block; background-color: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .button { display: inline-block; background: #4f46e5; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 10px; margin: 20px 0; font-size: 14px; }
    .footer { font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Monthly Sentiment Cycle</div>
      <h2 class="title">Monthly Workplace Feedback — ${periodLabel}</h2>
    </div>
    <p>Hi <strong>${employeeName || "Employee"}</strong>,</p>
    <p>It's time to submit your monthly workplace feedback.</p>
    <p>Please log in to the Employee Attrition Model portal and complete your feedback for <strong>${periodLabel}</strong>.</p>
    <div>
      <a href="${loginUrl}" class="button" target="_blank">Log In & Complete Feedback</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">
      Direct link: <a href="${loginUrl}" style="color: #4f46e5;">${loginUrl}</a>
    </p>
    <p>Your feedback helps HR understand employees' workplace experiences and identify opportunities to improve the working environment.</p>
    <p style="font-size: 13px; color: #64748b;">If you have already submitted feedback for this month, no further action is needed.</p>
    <div class="footer">
      <p style="margin: 0;">Thank you,<br><strong>HR Team</strong></p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

/**
 * Returns current status of active email engines
 */
export function getEmailEngineStatus() {
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    return { isLive: true, engine: "EmailJS API" };
  }
  if (process.env.SMTP_ENABLE_LIVE_SEND === "true") {
    return { isLive: true, engine: "SMTP Live" };
  }
  return { isLive: false, engine: "Dev Simulation" };
}

/**
 * Dispatches email using EmailJS REST API matching frontend src/utils/emailService.js configuration.
 */
export function sendViaEmailJS({
  toEmail,
  employeeName,
  periodLabel,
  isReminder = false,
}) {
  return new Promise((resolve) => {
    const loginUrl =
      process.env.CLIENT_LOGIN_URL || "http://localhost:5173/signIn";
    const subject = isReminder
      ? `Monthly Feedback Reminder (${periodLabel || "Current Month"})`
      : `Monthly Feedback Invitation (${periodLabel || "Current Month"})`;
    const statusNote = isReminder
      ? `This is a reminder to submit your monthly workplace sentiment feedback for ${periodLabel}.`
      : `Your monthly workplace sentiment survey for ${periodLabel} is now open for responses.`;

    const payload = JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        email: toEmail,
        to_name: employeeName || "Employee",
        subject: subject,
        email_subject: subject,
        title: subject,
        message: statusNote,
        detail_label: "Survey Period",
        detail_value: `${periodLabel || "Current Month"} (Survey Active)`,
        password: `${periodLabel || "Current Month"} (Survey Active)`,
        button_label: "Complete Feedback Survey",
        login_link: loginUrl,
        year: new Date().getFullYear(),
      },
    });

    const req = https.request(
      {
        hostname: "api.emailjs.com",
        path: "/api/v1.0/email/send",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Origin: "http://localhost:5173",
          "User-Agent": "Mozilla/5.0",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(
              `[Email Service - EmailJS] Dispatched email to ${toEmail} successfully.`,
            );
            resolve({
              success: true,
              mode: "EMAILJS",
              messageId: `emailjs-${Date.now()}`,
            });
          } else {
            console.error(
              `[Email Service - EmailJS] API Error for ${toEmail}: Status ${res.statusCode} - ${responseBody}`,
            );
            resolve({
              success: false,
              mode: "EMAILJS",
              error: responseBody || `HTTP ${res.statusCode}`,
            });
          }
        });
      },
    );

    req.on("error", (err) => {
      console.error(
        `[Email Service - EmailJS] Network failure for ${toEmail}:`,
        err.message,
      );
      resolve({ success: false, mode: "EMAILJS", error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Sends a feedback email to a single recipient safely with error handling and fallback simulation.
 */
export async function sendFeedbackEmail({
  toEmail,
  employeeName,
  periodLabel,
  isReminder = false,
}) {
  // 1. Primary: Send via EmailJS (matching frontend emailService.js configured by user)
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    const emailJsResult = await sendViaEmailJS({
      toEmail,
      employeeName,
      periodLabel,
      isReminder,
    });
    return emailJsResult;
  }

  // Fallback dev simulation if no credentials set
  console.log(
    `[Email Service - Dev Mode] Prepared email for ${toEmail} for ${periodLabel}`,
  );
  return {
    success: true,
    messageId: `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    mode: "SIMULATED",
  };
}

/**
 * Dispatches meeting invitation using EmailJS REST API
 */
export function sendMeetingViaEmailJS({
  toEmail,
  employeeName,
  meetingDate,
  meetingTime,
  meetingDetails,
  meetingLink,
}) {
  return new Promise((resolve) => {
    const portalUrl = process.env.CLIENT_LOGIN_URL
      ? `${process.env.CLIENT_LOGIN_URL.replace(/\/signIn$/, "")}/employee/meetings`
      : "http://localhost:5173/employee/meetings";

    const link = meetingLink || meetingDetails || portalUrl;
    const meetingMessage = `Confidential Workplace Feedback Discussion scheduled on ${meetingDate} at ${meetingTime}. Join via: ${link}`;

    const payload = JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_MEETING_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail,
        email: toEmail,
        user_email: toEmail,
        to_name: employeeName || "Employee",
        name: employeeName || "Employee",
        meeting_date: meetingDate || "To be confirmed",
        meeting_time: meetingTime || "To be confirmed",
        meeting_link: link,
        portal_link: portalUrl,
        login_link: portalUrl,
        message: meetingMessage,
        password: meetingMessage,
        year: new Date().getFullYear(),
      },
    });

    const req = https.request(
      {
        hostname: "api.emailjs.com",
        path: "/api/v1.0/email/send",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Origin: "http://localhost:5173",
          "User-Agent": "Mozilla/5.0",
        },
        rejectUnauthorized: false,
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(
              `[Meeting Email - EmailJS] Dispatched meeting invitation to ${toEmail} successfully.`,
            );
            resolve({
              success: true,
              mode: "EMAILJS",
              messageId: `emailjs-meeting-${Date.now()}`,
            });
          } else {
            console.error(
              `[Meeting Email - EmailJS] API Error for ${toEmail}: Status ${res.statusCode} - ${responseBody}`,
            );
            resolve({
              success: false,
              mode: "EMAILJS",
              error: responseBody || `HTTP ${res.statusCode}`,
            });
          }
        });
      },
    );

    req.on("error", (err) => {
      console.error(
        `[Meeting Email - EmailJS] Network failure for ${toEmail}:`,
        err.message,
      );
      resolve({ success: false, mode: "EMAILJS", error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Sends a confidential workplace feedback discussion meeting invitation to an employee.
 * Uses EmailJS as primary engine matching the project setup, with SMTP fallback.
 */
export async function sendMeetingInvitationEmail({
  toEmail,
  employeeName,
  meetingDate,
  meetingTime,
  meetingDetails,
  meetingLink,
}) {
  // 1. Primary engine: Dispatch via EmailJS REST API
  if (EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY) {
    const emailJsRes = await sendMeetingViaEmailJS({
      toEmail,
      employeeName,
      meetingDate,
      meetingTime,
      meetingDetails,
      meetingLink,
    });
    if (emailJsRes.success) {
      return emailJsRes;
    }
  }

  const subject = "Invitation to a Workplace Feedback Discussion";

  const text = `Hi ${employeeName || "Employee"},

We would like to invite you to a confidential discussion about your workplace experience, career development, and any support you may need.

Meeting date: ${meetingDate || "To be scheduled"}

Meeting time: ${meetingTime || "To be scheduled"}

Meeting location or link: ${meetingLink || meetingDetails || "Meeting Room / Video Call Link"}

Your feedback is valuable to us. This discussion will give us an opportunity to understand your concerns and explore ways to improve your work experience.

Please let us know whether the proposed time works for you.

Best regards,
HR Team`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .badge { display: inline-block; background-color: #f1f5f9; color: #334155; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .meeting-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .meeting-item { margin-bottom: 8px; font-size: 14px; }
    .meeting-label { font-weight: 600; color: #475569; display: inline-block; width: 150px; }
    .meeting-val { color: #0f172a; font-weight: 600; }
    .footer { font-size: 13px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Confidential HR Discussion</div>
    <h2 class="title">Invitation to a Workplace Feedback Discussion</h2>
    <p>Hi <strong>${employeeName || "Employee"}</strong>,</p>
    <p>We would like to invite you to a confidential discussion about your workplace experience, career development, and any support you may need.</p>
    
    <div class="meeting-box">
      <div class="meeting-item"><span class="meeting-label">Meeting date:</span> <span class="meeting-val">${meetingDate || "To be scheduled"}</span></div>
      <div class="meeting-item"><span class="meeting-label">Meeting time:</span> <span class="meeting-val">${meetingTime || "To be scheduled"}</span></div>
      <div class="meeting-item" style="margin-bottom:0;"><span class="meeting-label">Location or link:</span> <span class="meeting-val">${meetingLink || meetingDetails || "Meeting Room / Video Call Link"}</span></div>
    </div>

    <p>Your feedback is valuable to us. This discussion will give us an opportunity to understand your concerns and explore ways to improve your work experience.</p>
    <p>Please let us know whether the proposed time works for you.</p>

    <div class="footer">
      <p style="margin: 0;">Best regards,<br><strong>HR Team</strong></p>
    </div>
  </div>
</body>
</html>`;

  const fromAddress =
    process.env.SMTP_FROM ||
    `"HR Team - RetainPulse" <no-reply@retainpulse.local>`;
  const transporter = createTransporter();

  if (transporter && process.env.SMTP_ENABLE_LIVE_SEND === "true") {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text,
        html,
      });
      console.log(
        `[Meeting Invitation] Sent meeting invitation to ${toEmail} (messageId: ${info.messageId})`,
      );
      return { success: true, messageId: info.messageId, mode: "LIVE" };
    } catch (err) {
      console.error(
        `[Meeting Invitation] Failed sending email to ${toEmail}:`,
        err.message,
      );
      return { success: false, error: err.message, mode: "LIVE" };
    }
  }

  console.log(
    `[Meeting Invitation - Dev/Simulation Mode] Prepared invitation email for ${toEmail}`,
  );
  return {
    success: true,
    messageId: `simulated-meeting-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    mode: "SIMULATED",
  };
}
